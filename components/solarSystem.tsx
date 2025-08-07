import React, { useRef, useEffect, useState } from "react";
import { CreateSolarBodies, DefaultSolarBodies, SolarBodyConfig, Sun } from "./solarBodies";
import { CreatePOI, defaultPOIs } from "./pointOfInterest";
import { EphemerisPoint } from "../pages/api/earth-orbit";
import { CreateSun } from "./Sun";
import styles from "../styles/solar-system.module.css";

const MAX_COORD = 1000;

export default function SolarSystem() {
  const width = useWindowWidth();
  const aspect = 20 / 10; // 16:10 aspect ratio
  const height = width / aspect;
  const centerX = width / 2;
  const centerY = height / 2;

  // Local state for solar bodies with fetched orbitTrajectory
  const [rawBodies] = useState<SolarBodyConfig[]>(DefaultSolarBodies); // Never changes
  const [fetchedBodies, setFetchedBodies] = useState<SolarBodyConfig[]>([]);
  const [earth, setEarth] = useState<SolarBodyConfig | null>(DefaultSolarBodies.find(b => b.name === "Earth")!);
  const hasFetched = useRef(false);


  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchOrbits = async () => {
      try {
        const fetched = await Promise.all(
          rawBodies.map(async (body: SolarBodyConfig) => {
            if (!body.orbitApi) throw new Error(`orbitApi is required for ${body.name}`);
            console.log("Fetching orbit for", body.name);
            const res = await fetch(body.orbitApi);
            const orbitPoints = await res.json() as EphemerisPoint[];
            return { ...body, orbitTrajectory: orbitPoints };
          })
        );

        rescaleOrbits(fetched, width, height);

        setFetchedBodies(fetched);
        setEarth(fetched.find(b => b.name === "Earth")!);
      } catch (err) {
        console.error("Failed to fetch orbits:", err);
      }
    };

    fetchOrbits();
  }, []);

  return (
    <svg
      width={width}
      height={height}
      className={styles.solarSystem}
      viewBox={`${-MAX_COORD} ${-MAX_COORD} ${MAX_COORD * 2} ${MAX_COORD * 2}`}
      preserveAspectRatio="xMidYMid meet"
    >

      <CreateSun x={centerX} y={centerY} sun={Sun} />
      <CreateSolarBodies bodies={fetchedBodies} />
      {/* Points of Interest */}
      {earth && earth.orbitTrajectory && defaultPOIs.map(poi => (
        <CreatePOI key={poi.id} earth={earth} poi={poi} />
      ))}
    </svg>
  );
}

function useWindowWidth() {
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1600);
  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

function rescaleOrbits(
  bodies: SolarBodyConfig[],
  width: number,
  height: number,
): [SolarBodyConfig[], number] {
  // Gather all distances from the sun (for all points)
  const allDistances: number[] = [];
  let sumDist = 0;
  bodies.forEach(body => {
    const points = body.orbitTrajectory;
    if (points && points.length > 0) {
      for (const pt of points) {
        const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
        allDistances.push(dist);
        sumDist += dist;
      }
    }
  });

  // Use a large bin to avoid floating-point noise
  const modeDist = getMode(allDistances, 1e7); // bin size = 10M km

  if (modeDist <= 0) {
    console.log("Mode distance is non-positive. Returning");
    return [bodies, 0];
  }
  // The scale maps the mode distance to halfway
  const scale = MAX_COORD / modeDist * 0.7;

  bodies.forEach(body => {
    const points = body.orbitTrajectory;
    if (points) {
      points.forEach(pt => {
        pt.x = pt.x * scale;
        pt.y = pt.y * scale;
      });
    }
  })

  return [bodies, scale]
}

// Helper: computes the mode of an array, using a bin size to group nearby values
function getMode(distances: number[], binSize: number = 1e7) {
  const bins = new Map<number, number>();
  for (const d of distances) {
    const b = Math.round(d / binSize) * binSize;
    bins.set(b, (bins.get(b) || 0) + 1);
  }
  let mode = 0, maxCount = 0;
  for (const [b, count] of bins) {
    if (count > maxCount) {
      maxCount = count;
      mode = b;
    }
  }
  return mode;
}

