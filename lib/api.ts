// src/lib/api.ts
import type { PointOfInterestDTO, CreatePOIInput, UpdatePOIInput } from "../types/poi";

export async function fetchPOIs(): Promise<PointOfInterestDTO[]> {
  const r = await fetch("/api/pois", { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to fetch POIs");
  return r.json();
}

export async function createPOI(body: CreatePOIInput): Promise<PointOfInterestDTO> {
  const r = await fetch("/api/pois", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed to create POI");
  return r.json();
}

export async function updatePOI(id: string, patch: UpdatePOIInput): Promise<PointOfInterestDTO> {
  const r = await fetch(`/api/pois/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("Failed to update POI");
  return r.json();
}

export async function deletePOI(id: string): Promise<void> {
  const r = await fetch(`/api/pois/${id}`, { method: "DELETE" });
  if (!r.ok && r.status !== 204) throw new Error("Failed to delete POI");
}

export async function uploadImageBase64(contentType: string, dataBase64: string) {
  const r = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, dataBase64 }),
  });
  if (!r.ok) throw new Error("Failed to upload image");
  return r.json() as Promise<{ id: string; url: string }>;
}
