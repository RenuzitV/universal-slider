// src/components/OrbitPath.tsx
import React, { useMemo } from "react";
import type { SolarBodyConfig } from "./SolarBodies";

export default function OrbitPath({ earth }: { earth?: SolarBodyConfig | null }) {
  const d = useMemo(() => {
    const pts = earth?.orbitTrajectory;
    if (!pts || pts.length === 0) return "";
    return pts
      .map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [earth]);

  if (!d) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke="rgba(255,255,255,0.28)"
      strokeWidth={1.6}
      vectorEffect="non-scaling-stroke"
    />
  );
}
