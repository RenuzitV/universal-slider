// src/types/poi.ts
export interface PointOfInterestDTO {
  id: string;
  date: string;              // ISO over the wire
  title: string;
  description: string;
  imageURLs?: string[];      // ← single source of truth
}

export type CreatePOIInput = Omit<PointOfInterestDTO, "id">;
export type UpdatePOIInput = Partial<Omit<PointOfInterestDTO, "id">>;
