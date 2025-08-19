// src/components/YearProgressRail.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "../styles/day-rail.module.css";
import { startOfYear, endOfYear, daysInYear, dayOfYear } from "./dateRange";

type CSSHeight = number | string; // NEW

export default function YearProgressRail({
  selectedDate,
  minYear,
  maxYear,
  onPrevYear,
  onNextYear,
  height,                       // ← string | number
  thresholdDays = 20,
}: {
  selectedDate: Date;
  minYear: number;
  maxYear: number;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  height?: CSSHeight;
  thresholdDays?: number;
}) {
  const effectiveHeight = height ?? "100%"; // NEW
  const padStart = minYear - 1, padEnd = maxYear + 1;

  const areaRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const timelineStart = startOfYear(padStart);
  const timelineEnd   = endOfYear(padEnd);
  const totalDays = Math.floor((+timelineEnd - +timelineStart) / 86400000) + 1;

  const selMs = Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate());
  const startMs = +timelineStart;
  const progress = width ? Math.max(0, Math.min(1, (selMs - startMs) / (totalDays * 86400000))) : 0;

  const y = selectedDate.getUTCFullYear();
  const doy = dayOfYear(selectedDate);
  const remain = daysInYear(y) - doy;

  const ticks = useMemo(() => {
    if (!width) return [];
    const arr: { x: number; year: number }[] = [];
    for (let Y = padStart; Y <= padEnd; Y++) {
      const ms = +startOfYear(Y);
      const p = Math.max(0, Math.min(1, (ms - startMs) / (totalDays * 86400000)));
      arr.push({ x: Math.round(p * width), year: Y });
    }
    return arr;
  }, [padStart, padEnd, startMs, totalDays, width]);

  const thumbX = Math.round(progress * width);

  return (
    <div className={styles.yearBarWrap} style={{ height: effectiveHeight, width: "100%" }}>
      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={onPrevYear} aria-label="Previous year">‹</button>
      </div>

      <div className={styles.yearTrackArea} ref={areaRef}>
        <div className={styles.yearTrack} />
        {ticks.map(t => (<div key={t.year} className={styles.yearTick} style={{ left: t.x }} title={`${t.year}`} />))}
        <div className={styles.yearThumb} style={{ left: thumbX }} />
        <div className={styles.yearCenterChip}>
          <div className={styles.yearLabel}>{y}</div>
          <div className={styles.yearSub}>{doy}/{daysInYear(y)}</div>
        </div>
        <div className={styles.yearCutoff} style={{ opacity: remain <= thresholdDays ? 1 : 0 }} />
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={onNextYear} aria-label="Next year">›</button>
      </div>
    </div>
  );
}
