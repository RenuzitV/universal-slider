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

export async function uploadImageBase64(
  contentType: string,
  base64: string,
) {
  const res = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, data: base64 }),
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  const data = await res.json();

  // accept either {id} or {id,url}
  const id  = data.id ?? data.imageId ?? null;
  const url = data.url ?? (id ? `/api/image/${id}` : null);
  if (!url) throw new Error("Upload response missing id/url");

  return { id, url };
}

export async function deletePOI(id: string) {
  const res = await fetch(`/api/pois/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`delete failed: ${res.status}`);
  return { ok: true };
}
