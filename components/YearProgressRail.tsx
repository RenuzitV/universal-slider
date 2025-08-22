// src/components/YearProgressRail.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import y from "../styles/year-rail.module.css";
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

  const yval = selectedDate.getUTCFullYear();
  const doy = dayOfYear(selectedDate);
  const remain = daysInYear(yval) - doy;

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
    <div className={y.yearBarWrap} style={{ height }}>
      <div className={y.btnGroup}>
        <button className={y.ctrlBtn} onClick={onPrevYear} aria-label="Previous year">‹</button>
      </div>

      <div className={y.yearTrackArea} ref={areaRef}>
        <div className={y.yearTrack} />
        {ticks.map(t => (<div key={t.year} className={y.yearTick} style={{ left: t.x }} title={`${t.year}`} />))}
        <div className={y.yearThumb} style={{ left: thumbX }} />
        <div className={y.yearCenterChip}>
          <div className={y.yearLabel}>{yval}</div>
          <div className={y.yearSub}>{doy}/{daysInYear(yval)}</div>
        </div>
        <div className={y.yearCutoff} style={{ opacity: remain <= thresholdDays ? 1 : 0 }} />
      </div>

      <div className={y.btnGroup}>
        <button className={y.ctrlBtn} onClick={onNextYear} aria-label="Next year">›</button>
      </div>
    </div>
  );
}
