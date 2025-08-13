// src/components/POILayer.tsx
import React, { useMemo, useState } from "react";
import { dayKey } from "./dateKeys";
import styles from "../styles/solar-system.module.css";
import type { SolarBodyConfig } from "./solarBodies";
import { PointOfInterest } from "./pointOfInterest";

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

function offsetAlongRadial(x: number, y: number, radial: number, step = 18, idx = 0) {
    const nx = Math.cos(radial);
    const ny = Math.sin(radial);
    return { x: x + nx * step * idx, y: y + ny * step * idx };
}

export function POILayer({
    earth,
    pois,
    currentYear,
    selectedDayKey,
}: {
    earth?: SolarBodyConfig;
    pois: PointOfInterest[];
    currentYear: number;
    selectedDayKey: string; // "MM-DD"
}) {
    const orbitMap = useOrbitMap(earth);
    const [hoverId, setHoverId] = useState<string | null>(null);

    // Only POIs from the selected year
    const yearPOIs = useMemo(
        () => pois.filter(p => p.date.getFullYear() === currentYear),
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
        for (const [k, arr] of m) arr.sort((a, b) => a.date.getTime() - b.date.getTime());
        return m;
    }, [yearPOIs]);

    const entries = Array.from(byDay.entries());
    const nonSelected = entries.filter(([k]) => k !== selectedDayKey);
    const selected = entries.find(([k]) => k === selectedDayKey);

    return (
        <g>
            {/* Non-selected days first (go underneath) */}
            {nonSelected.map(([k, list]) => {
                const base = orbitMap.get(k);
                if (!base) return null;
                return list.map(poi => {
                    const isHover = hoverId === poi.id;
                    return (
                        <g
                            key={poi.id}
                            onMouseEnter={() => setHoverId(poi.id)}
                            onMouseLeave={() => setHoverId(null)}
                            style={{ transition: "opacity 180ms ease, transform 180ms ease" }}
                        >
                            <circle cx={base.x} cy={base.y} r={14} className={styles.poi} />
                            {isHover && (
                                <foreignObject
                                    x={base.x}
                                    y={base.y - 180}
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
                });
            })}

            {/* Selected day last (on top). Stack along radial for clarity */}
            {selected && (() => {
                const [k, list] = selected;
                const base = orbitMap.get(k);
                if (!base) return null;

                // render hovered one last for topmost z-order
                const hovered = list.find(p => p.id === hoverId);
                const rest = list.filter(p => p.id !== hoverId);
                const center = Math.floor((list.length - 1) / 2);

                const renderPOI = (poi: PointOfInterest, idx: number) => {
                    const offsetIdx = idx - center;
                    const pos = offsetAlongRadial(base.x, base.y, base.radial, 18, offsetIdx);
                    const isHover = hoverId === poi.id;
                    return (
                        <g
                            key={poi.id}
                            onMouseEnter={() => setHoverId(poi.id)}
                            onMouseLeave={() => setHoverId(null)}
                            style={{
                                transition: "opacity 180ms ease, transform 180ms ease",
                            }}
                        >
                            <circle cx={pos.x} cy={pos.y} r={16} className={styles.poi} strokeWidth={4} />
                            {(isHover || true) && (
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
                    <>
                        {rest.map((poi, i) => renderPOI(poi, i))}
                        {hovered ? renderPOI(hovered, list.indexOf(hovered)) : null}
                    </>
                );
            })()}
        </g>
    );
}
