import React, { useMemo, useState } from "react";
import { dayKey } from "./dateKeys";
import styles from "../styles/solar-system.module.css";
import type { SolarBodyConfig } from "./SolarBodies";
import { PointOfInterest } from "./PointOfInterest";

type OrbitPoint = { x: number; y: number; date: string | Date; radial?: number };

function useOrbitMap(earth?: SolarBodyConfig) {
  return useMemo(() => {
    const map = new Map<string, { x: number; y: number; radial: number }>();
    const pts = earth?.orbitTrajectory as OrbitPoint[] | undefined;
    if (!pts) return map;
    for (const p of pts) {
      const d = new Date(p.date);
      const key = dayKey(d);
      const radial = p.radial ?? Math.atan2(p.y, p.x);
      map.set(key, { x: p.x, y: p.y, radial });
    }
    return map;
  }, [earth]);
}

function offsetAlongRadial(
  x: number,
  y: number,
  radial: number,
  step = 18,
  idx = 0
) {
  const nx = Math.cos(radial);
  const ny = Math.sin(radial);
  return { x: x + nx * step * idx, y: y + ny * step * idx };
}

type Props = {
  earth: SolarBodyConfig;
  pois: PointOfInterest[];
  currentYear: number;
  selectedDayKey: string;          // "MM-DD"
  selectedPoiId: string | null;
  onSelectPoi: (id: string | null) => void;
};

export function POILayer({
  earth,
  pois,
  currentYear,
  selectedDayKey,
  selectedPoiId,
  onSelectPoi,
}: Props) {
  const orbitMap = useOrbitMap(earth);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Only POIs from the selected year
  const yearPOIs = useMemo(
    () => pois.filter((p) => p.date.getFullYear() === currentYear),
    [pois, currentYear]
  );

  // group by day
  const byDay = useMemo(() => {
    const m = new Map<string, PointOfInterest[]>();
    for (const p of yearPOIs) {
      const k = dayKey(p.date);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    for (const [, arr] of m) arr.sort((a, b) => a.date.getTime() - b.date.getTime());
    return m;
  }, [yearPOIs]);

  const entries = Array.from(byDay.entries());

  // put the group that contains the selected POI last (topmost); else the selected day group last
  const selectedGroupIndex = entries.findIndex(([, list]) =>
    list.some((p) => p.id === selectedPoiId)
  );
  const selectedDayIndex = entries.findIndex(([k]) => k === selectedDayKey);
  const groupsOrdered = [...entries];
  if (selectedGroupIndex >= 0) {
    const [g] = groupsOrdered.splice(selectedGroupIndex, 1);
    groupsOrdered.push(g);
  } else if (selectedDayIndex >= 0) {
    const [g] = groupsOrdered.splice(selectedDayIndex, 1);
    groupsOrdered.push(g);
  }

  const renderPOI = (
    base: { x: number; y: number; radial: number },
    list: PointOfInterest[],
    poi: PointOfInterest
  ) => {
    // index within THIS day's list → fan-out along radial so same-day points don't overlap
    const idx = list.indexOf(poi);
    const center = Math.floor((list.length - 1) / 2);
    const offsetIdx = list.length > 1 ? idx - center : 0;

    const pos =
      list.length > 1
        ? offsetAlongRadial(base.x, base.y, base.radial, 18, offsetIdx)
        : { x: base.x, y: base.y };

    const isHover = hoverId === poi.id;
    const isSelected = selectedPoiId === poi.id;

    // animate radius instead of using transform: scale()
    const baseR = 16;
    const hoverR = 18;
    const selectedR = 24;
    const r = isSelected ? selectedR : isHover ? hoverR : baseR;

    return (
      <g
        key={poi.id}
        onMouseEnter={() => setHoverId(poi.id)}
        onMouseLeave={() => setHoverId(null)}
        onClick={() => onSelectPoi?.(isSelected ? null : poi.id)}
        style={{ cursor: "pointer" }}
      >
        {/* spinning dashed ring (visible when selected) */}
        {isSelected && (
          <circle
            cx={pos.x}
            cy={pos.y}
            r={r + 18}
            fill="none"
            stroke="rgba(230,122,255,0.95)"
            strokeWidth={3.5}
            strokeDasharray="6 10"
            className={styles.rotating}
          />
        )}

        {/* base dot — grows by changing r (no transform), soft glow on hover/selected */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={r}
          className={styles.poi}
          strokeWidth={3}
          style={{
            transition: "r 220ms ease, filter 220ms ease",
            filter: isSelected
              ? "drop-shadow(0 0 14px rgba(230,122,255,0.9))"
              : isHover
              ? "drop-shadow(0 0 10px rgba(230,122,255,0.6))"
              : "none",
          }}
        />

        {/* popup restored */}
        {(isHover || isSelected) && (
          <foreignObject
            x={pos.x}
            y={pos.y - 190}
            width={1}
            height={1}
            style={{ overflow: "visible", pointerEvents: "none" }}
          >
            <div className={`${styles.popup} ${styles.popupAnchor}`}>
              <div className={styles.popupTitle}>{poi.title}</div>
              <div className={styles.popupDate}>
                {poi.date.toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Australia/Melbourne",
                })}
              </div>
              <div className={styles.popupDesc}>{poi.description}</div>
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  return (
    <g>
      {groupsOrdered.map(([k, list]) => {
        const base = orbitMap.get(k);
        if (!base) return null;

        // render non-selected first, then selected last for higher z
        const selected = list.find((p) => p.id === selectedPoiId);
        const rest = list.filter((p) => p.id !== selectedPoiId);

        return (
          <g key={k}>
            {rest.map((poi) => renderPOI(base, list, poi))}
            {selected ? renderPOI(base, list, selected) : null}
          </g>
        );
      })}
    </g>
  );
}
