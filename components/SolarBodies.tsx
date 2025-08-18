import { EphemerisPoint } from "../pages/api/earth-orbit";

export interface SolarBodyConfig {
  name: string;
  color: string;
  radius: number;
  orbitApi: string; // Orbit config API endpoint is now mandatory
  orbitTrajectory: EphemerisPoint[] | null; // Will be populated after fetching
}

export const Sun: SolarBodyConfig = {
  name: "Sun",
  color: "#FFD700",
  radius: 100,
  orbitApi: "", // Sun is at the center, no orbit
  orbitTrajectory: null,
}

export const DefaultSolarBodies: SolarBodyConfig[] = [
  {
    name: "Earth",
    color: "#1e9fff",
    radius: 40,
    orbitApi: "/api/earth-orbit", 
    orbitTrajectory: null,
  },
  // Add more bodies as needed
];

export function CreateSolarBodies({ bodies }: { bodies: SolarBodyConfig[] }) {
  {/* Orbits and bodies */ }
  return bodies.map((body, _) => {
    const points = body.orbitTrajectory;

    if (!points) return null;

    const orbitPathString = points.map(pt => `${pt.x},${pt.y}`).join(" ");

    // render first point as our earth's current position
    const firstPoint = points[0];

    return (
      <g key={body.name}>
        <polyline
          points={orbitPathString}
          fill="none"
          stroke={body.color}
          strokeWidth={4}
          opacity={0.7}
        />
        <circle
          cx={firstPoint.x}
          cy={firstPoint.y}
          r={body.radius}
          fill={body.color}
          stroke="#fff"
          strokeWidth={4}
        />
      </g>
    );
  })
}
