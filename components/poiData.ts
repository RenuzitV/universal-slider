// src/components/poiData.ts
import { PointOfInterest } from "./PointOfInterest";

// Stable sort by Date ascending (oldest → newest)
export function sortPOIs<T extends { date: Date | string }>(list: T[]): T[] {
    // normalize to Date and copy
    return [...list]
        .map(p => ({
            ...p,
            date: p.date instanceof Date ? p.date : new Date(p.date),
        }))
        .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());
}

// Example: load from API and return sorted list (adjust URL/shape to your API)
export async function loadPOIs(endpoint: string): Promise<PointOfInterest[]> {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Failed to fetch POIs: ${res.status}`);
    const json = await res.json() as Array<Omit<PointOfInterest, "date"> & { date: string }>;
    const sorted = sortPOIs(json).map(p => ({ ...p, date: new Date(p.date) }));
    return sorted;
}
