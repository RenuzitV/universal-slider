// src/components/POILayer.tsx
import React, { useMemo } from "react";
import { dayKey } from "./dateKeys";
import type { SolarBodyConfig } from "./SolarBodies";
import type { PointOfInterest } from "./pointOfInterest";
import POIOrbitMarker from "./POIOrbitMarker";

type OrbitPoint = { x: number; y: number; date: string | Date; radial?: number };

function useOrbitMap(earth?: SolarBodyConfig) {
  return useMemo(() => {
    const map = new Map<string, { x: number; y: number; radial: number }>();
    const pts = earth?.orbitTrajectory as OrbitPoint[] | undefined;
    if (!pts) return map;
    for (const p of pts) {
      const d = new Date(p.date);
      const k = dayKey(d);
      const radial = p.radial ?? Math.atan2(p.y, p.x);
      map.set(k, { x: p.x, y: p.y, radial });
    }
    return map;
  }, [earth]);
}

export function POILayer({
  earth,
  pois,
  currentYear,
  selectedDayKey,
  selectedPoiId,
  onSelectPoi,
  onOpenGallery,
}: {
  earth: SolarBodyConfig;
  pois: PointOfInterest[];
  currentYear: number;
  selectedDayKey: string;          // "MM-DD"
  selectedPoiId: string | null;
  onSelectPoi: (id: string | null) => void;
  onOpenGallery?: (poi: PointOfInterest) => void;
}) {
  const orbitMap = useOrbitMap(earth);

  // Only POIs from the selected year, grouped by day key
  const groupsOrdered = useMemo(() => {
    // group
    const byDay = new Map<string, PointOfInterest[]>();
    for (const p of pois) {
      if (p.date.getFullYear() !== currentYear) continue;
      const k = dayKey(p.date);
      const arr = byDay.get(k);
      if (arr) arr.push(p);
      else byDay.set(k, [p]);
    }
    // stable sort within each day by date
    for (const [, arr] of byDay) {
      arr.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    // order days; push selected POI's day last, else selected day last
    const entries = Array.from(byDay.entries());
    const idxSelPOIDay = entries.findIndex(([, list]) => list.some(p => p.id === selectedPoiId));
    const idxSelDay = entries.findIndex(([k]) => k === selectedDayKey);
    if (idxSelPOIDay >= 0) {
      const [g] = entries.splice(idxSelPOIDay, 1);
      entries.push(g);
    } else if (idxSelDay >= 0) {
      const [g] = entries.splice(idxSelDay, 1);
      entries.push(g);
    }
    return entries;
  }, [pois, currentYear, selectedDayKey, selectedPoiId]);

  return (
    <g>
      {groupsOrdered.map(([k, list]) => {
        const base = orbitMap.get(k);
        if (!base) return null;

        // Render each POI exactly once, but ensure the selected (if any) is drawn last for z-order.
        const orderedList =
          selectedPoiId
            ? [
                ...list.filter(p => p.id !== selectedPoiId),
                ...list.filter(p => p.id === selectedPoiId),
              ]
            : list;

        return (
          <g key={k}>
            {orderedList.map((poi) => (
              <POIOrbitMarker
                key={poi.id}
                base={base}
                poi={poi}
                // Use original index in the day's list so offsets stay symmetric
                indexInGroup={list.indexOf(poi)}
                groupSize={list.length}
                selected={poi.id === selectedPoiId}
                onSelect={onSelectPoi}
                onOpenGallery={onOpenGallery}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
