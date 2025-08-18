// src/components/EarthMarker.tsx
import React, { useMemo } from "react";
import { SolarBodyConfig } from "./SolarBodies";
import styles from "../styles/solar-system.module.css";

type Props = {
  earth: SolarBodyConfig;
  dayKey: string; // "MM-DD"
};

export default function EarthMarker({ earth, dayKey }: Props) {
  const pt = useMemo(() => {
    // find the ephemeris point whose date matches the month-day (as you already do)
    const match = earth.orbitTrajectory!.find(p => {
      const d = typeof p.date === "string" ? new Date(p.date) : (p.date as Date);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${m}-${dd}` === dayKey;
    });
    return match ?? earth.orbitTrajectory![0];
  }, [earth, dayKey]);

  if (!pt) return null;

  return (
    <g
      className={styles.planetWrap}                       // <-- transition lives here
      transform={`translate(${pt.x}, ${pt.y})`}
    >
      <circle r={12} className={styles.earthDot} />
      <circle r={20} className={styles.earthGlow} />
    </g>
  );
}
