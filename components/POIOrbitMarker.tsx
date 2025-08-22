// src/components/POIOrbitMarker.tsx
import React, { useState } from "react";
import poi from "../styles/poi.module.css";
import popup from "../styles/popup.module.css";
import type { PointOfInterest } from "./pointOfInterest";

export type OrbitBase = { x: number; y: number; radial: number };

function offsetAlongRadial(x: number, y: number, radial: number, step = 18, idx = 0) {
  const nx = Math.cos(radial);
  const ny = Math.sin(radial);
  return { x: x + nx * step * idx, y: y + ny * step * idx };
}

export default function POIOrbitMarker({
  base, poi: p, indexInGroup, groupSize, selected, onSelect, onOpenGallery,
}: {
  base: OrbitBase;
  poi: PointOfInterest;
  indexInGroup: number;
  groupSize: number;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onOpenGallery?: (poi: PointOfInterest) => void;
}) {
  const [hover, setHover] = useState(false);

  const center = Math.floor((groupSize - 1) / 2);
  const offsetIdx = groupSize > 1 ? indexInGroup - center : 0;
  const pos = groupSize > 1
    ? offsetAlongRadial(base.x, base.y, base.radial, 18, offsetIdx)
    : { x: base.x, y: base.y };

  const handleDotClick = () => onSelect(selected ? null : p.id);

  return (
    <g
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleDotClick}
      style={{ cursor: "pointer" }}
    >
      {/* base dot */}
      <circle cx={pos.x} cy={pos.y} r={15} className={poi.poi} strokeWidth={3} />

      {/* selected ring */}
      {selected && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={40}
          fill="none"
          stroke="rgba(230,122,255,0.95)"
          strokeWidth={3.5}
          strokeDasharray="2 4"
          className={poi.rotating}
        />
      )}

      {(hover || selected) && (
        <foreignObject
          x={pos.x}
          y={pos.y}
          width={1}
          height={1}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div className={popup.popupContainer}>
            <div
              className={`${popup.popup} ${popup.popupAnchor}`}
              onClick={(e) => { e.stopPropagation(); onOpenGallery?.(p); }}
              style={{ pointerEvents: "auto", cursor: "pointer" }}
              title="Open photos"
            >
              <div className={popup.popupTitle}>
                {p.title}{" "}
                {p.imageURLs?.length ? (
                  <span className={popup.photoPill} aria-label={`${p.imageURLs.length} photos`}>
                    <span className={popup.photoIcon} aria-hidden="true">🖼️</span>
                    <span className={popup.photoCount}>+{p.imageURLs.length}</span>
                  </span>
                ) : null}
              </div>

              <div className={popup.popupDate}>
                {p.date.toLocaleDateString("en-AU", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                  timeZone: "Australia/Melbourne",
                })}
              </div>

              <div className={popup.popupDesc}>{p.description}</div>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
