// src/lib/poiStore.ts
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import { defaultPOIs } from "../components/pointOfInterest";
import type { PointOfInterestDTO, CreatePOIInput, UpdatePOIInput } from "../types/poi";

let pois: PointOfInterestDTO[] =
  defaultPOIs
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(p => ({
      id: p.id,
      date: p.date.toISOString(),
      title: p.title,
      description: p.description,
      imageURLs: (p as any).imageURLs ?? (p.imageURLs ? [p.imageURLs] : []),
    }));

export const listPOIs = () => pois.slice().sort((a,b)=>a.date.localeCompare(b.date));
export const getPOI = (id: string) => pois.find(p => p.id === id) ?? null;
export function createPOI(input: CreatePOIInput) {
  const poi: PointOfInterestDTO = { id: nanoid(), ...input };
  pois.push(poi); pois.sort((a,b)=>a.date.localeCompare(b.date));
  return poi;
}
export function updatePOI(id: string, patch: UpdatePOIInput) {
  const i = pois.findIndex(p => p.id === id); if (i < 0) return null;
  pois[i] = { ...pois[i], ...patch, id }; return pois[i];
}
export function deletePOI(id: string) {
  const prev = pois.length; pois = pois.filter(p => p.id !== id);
  return pois.length < prev;
}

/* ---- image blobs (id -> Buffer) ---- */
type ImageBlob = { contentType: string; data: Buffer };
const imageStore = new Map<string, ImageBlob>();

// mock IDs → public images
const MOCK: Record<string, string> = {
  "mock-01": "/images/poi1.jpg",
  "mock-02": "/images/poi2.jpg",
  "mock-03": "/images/poi3.jpg",
};

export function saveImageBase64(contentType: string, dataBase64: string) {
  const id = nanoid();
  imageStore.set(id, { contentType, data: Buffer.from(dataBase64, "base64") });
  return id;
}

export function readImageById(id: string): ImageBlob | null {
  const mem = imageStore.get(id);
  if (mem) return mem;
  const rel = MOCK[id];
  if (rel) {
    const fp = path.join(process.cwd(), "public", rel);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      return { contentType: guess(fp), data: buf };
    }
  }
  return null;
}
function guess(fp: string) {
  const ext = path.extname(fp).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}
