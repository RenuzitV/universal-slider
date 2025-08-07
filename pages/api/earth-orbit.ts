import { log } from 'console';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from "node-fetch";

// --- Define type for each orbit data point ---
export interface EphemerisPoint {
  date: Date;
  x: number;
  y: number;
  z: number;
}

const CACHE_INTERVAL_MS = 20 * 60 * 60 * 1000; // 20 hours

// Helper to fetch and parse data from JPL Horizons API
async function fetchEphemerisJson(): Promise<EphemerisPoint[]> {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  now.setFullYear(now.getFullYear() + 1); // One year later
  const stop = now.toISOString().slice(0, 10);

  // Use the GET API for text format
  const url = URL.parse(`https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='399'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='@10'&START_TIME='${start}'&STOP_TIME='${stop}'&STEP_SIZE='1%20DAYS'&VEC_TABLE='1'&REF_SYSTEM='ICRF'&CAL_TYPE='M'&OUT_UNITS='KM-S'`);

  const resp = await fetch(url!.toString());
  const text = await resp.text();

  // Parse block between $$SOE and $$EOE
  const data: EphemerisPoint[] = [];
  const lines = text.split('\n');
  let inBlock = false;
  let currentDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('$$SOE')) {
      inBlock = true;
      continue;
    }
    if (line.includes('$$EOE')) {
      break;
    }
    if (!inBlock) continue;

    // 1. Date line
    const dateMatch = line.match(/A\.D\.\s+([0-9]{4}-[A-Za-z]{3}-[0-9]{2})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      // 2. Next line should be XYZ
      const xyzLine = lines[i + 1] ?? "";
      const xyzMatch = xyzLine.match(/X\s*=\s*([-\d.E+]+)\s*Y\s*=\s*([-\d.E+]+)\s*Z\s*=\s*([-\d.E+]+)/);
      // 3. Next-next line should be VX VY VZ
      // const vLine = lines[i + 2] ?? "";
      // const vMatch = vLine.match(/VX=\s*([-\d.E+]+)\s*VY=\s*([-\d.E+]+)\s*VZ=\s*([-\d.E+]+)/);

      if (xyzMatch && currentDate) {
        let point: EphemerisPoint = {
          date: new Date(Date.parse(currentDate)),
          x: parseFloat(xyzMatch[1]),
          y: parseFloat(xyzMatch[2]),
          z: parseFloat(xyzMatch[3]),
        }
        data.push(point);
        i += 1; // Skip over the two lines just consumed
      }
      continue;
    }
  }

  return data;
}

// Cache logic
let lastFetch = 0;
let cachedData: EphemerisPoint[] | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const now = Date.now();

    if (now - lastFetch > CACHE_INTERVAL_MS) {
      lastFetch = now;
      try {
        cachedData = await fetchEphemerisJson();
        lastFetch = now;
      } catch (fetchErr: any) {
        console.error("[earth-orbit] Fetch/write error:", fetchErr);
        res.status(500).json({
          error: fetchErr.message,
          debug: "[earth-orbit] Error during fetch/write: " + String(fetchErr)
        });
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json(cachedData);
  } catch (e: any) {
    console.error("[earth-orbit] API handler error:", e);
    res.status(500).json({
      error: e.message,
      debug: "[earth-orbit] API handler error: " + String(e)
    });
  }
}
