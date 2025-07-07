import React, { useState, useRef } from "react";

function polarToCartesian(centerX, centerY, radius, angle) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

function angleFromPosition(x, y, centerX, centerY) {
  return Math.atan2(y - centerY, x - centerX);
}

export default function CircularSlider({ min = 0, max = 100, value, onChange, radius = 60 }) {
  const center = 75;
  const handleRadius = 12;
  const angle = ((value - min) / (max - min)) * 2 * Math.PI - Math.PI / 2;
  const handlePos = polarToCartesian(center, center, radius, angle);

  const dragging = useRef(false);

  function setFromEvent(e) {
    let clientX, clientY;
    if (e.type.startsWith("touch")) {
      const t = e.touches[0] || e.changedTouches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rect = e.target.closest("svg").getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let ang = angleFromPosition(x, y, center, center) + Math.PI / 2;
    if (ang < 0) ang += 2 * Math.PI;
    let newValue = Math.round(min + (ang / (2 * Math.PI)) * (max - min));
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    onChange(newValue);
  }

  function startDrag(e) {
    dragging.current = true;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
    setFromEvent(e);
  }

  function onDrag(e) {
    if (!dragging.current) return;
    setFromEvent(e);
    e.preventDefault();
  }

  function stopDrag() {
    dragging.current = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  }

  return (
    <svg width={150} height={150} style={{ userSelect: "none", touchAction: "none" }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e0e0e0" strokeWidth="12" />
      <circle
        cx={handlePos.x}
        cy={handlePos.y}
        r={handleRadius}
        fill="#4285f4"
        stroke="#222"
        strokeWidth="2"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{ cursor: "pointer" }}
      />
      <text x={center} y={center} textAnchor="middle" dy=".3em" fontSize="28" fontWeight="bold">
        {value}
      </text>
    </svg>
  );
}
