import { SolarBodyConfig } from "./solarBodies";
import styles from "../styles/solar-system.module.css";

export function CreateSun({ x: centerX, y: centerY, sun }: { x: number, y: number, sun: SolarBodyConfig }) {
    return (
        <g>
            <circle
                cx={0}
                cy={0}
                r={sun.radius}
                fill={sun.color}
                filter="url(#sunGlow)"
                className={styles.Sun}
            />
            <defs>
                <filter id="sunGlow">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </g>
    )
}
