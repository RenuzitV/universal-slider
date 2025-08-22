// src/components/Sun.tsx
import type { SolarBodyConfig } from "./SolarBodies";
import sunStyles from "../styles/sun.module.css";

export function CreateSun({
  sun,
}: {
  sun: SolarBodyConfig;
}) {
  return (
    <g className={sunStyles.sun}>
      <defs>
        <filter id="sunGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={0} cy={0} r={sun.radius} fill={sun.color} filter="url(#sunGlow)" />
    </g>
  );
}
