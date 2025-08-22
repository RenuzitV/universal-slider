// src/components/EarthMarker.tsx
import React, { useMemo } from "react";
import earth from "../styles/earth-marker.module.css";
import type { SolarBodyConfig } from "./SolarBodies";

type OrbitPoint = { x: number; y: number; date: string | Date };

export default function EarthMarker({ earth: earthBody, dayKey: key }: {
  earth: SolarBodyConfig;
  dayKey: string;
}) {
  const pos = useMemo(() => {
    const pts = earthBody?.orbitTrajectory as OrbitPoint[] | undefined;
    if (!pts?.length) return { x: 0, y: 0 };
    for (const p of pts) {
      const d = new Date(p.date);
      const k = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (k === key) return { x: p.x, y: p.y };
    }
    return { x: pts[0].x, y: pts[0].y };
  }, [earthBody, key]);

  return (
    <g className={earth.planetWrap} transform={`translate(${pos.x}, ${pos.y})`}>
      <circle r={10} className={earth.earthDot} />
      <circle r={18} className={earth.earthGlow} />
    </g>
  );
}
