// src/components/YearProgressRail.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "../styles/day-rail.module.css";
import { startOfYear, endOfYear, daysInYear, dayOfYear } from "./dateRange";

export default function YearProgressRail({
  selectedDate,                // actual Date in UTC (use Date with local if you prefer)
  minYear, maxYear,            // from your POIs (we’ll pad outside)
  onPrevYear, onNextYear,      // optional handlers to jump years
  height = 54,
  width = 720,
  thresholdDays = 20,          // when to show the “cutoff” cue near year end
}: {
  selectedDate: Date;
  minYear: number;
  maxYear: number;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  height?: number;
  width?: number;
  thresholdDays?: number;
}) {
  const padStart = minYear - 1, padEnd = maxYear + 1;
  const timelineStart = startOfYear(padStart);
  const timelineEnd   = endOfYear(padEnd);
  const totalDays = Math.floor((+timelineEnd - +timelineStart) / 86400000) + 1;

  const selMs = Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate());
  const startMs = +timelineStart;
  const progress = Math.max(0, Math.min(1, (selMs - startMs) / (totalDays * 86400000))); // 0..1

  const y = selectedDate.getUTCFullYear();
  const doy = dayOfYear(selectedDate);
  const remain = daysInYear(y) - doy;

  // precompute tick positions
  const ticks = useMemo(() => {
    const arr: { x: number; year: number }[] = [];
    for (let Y = padStart; Y <= padEnd; Y++) {
      const ms = +startOfYear(Y);
      const p = Math.max(0, Math.min(1, (ms - startMs) / (totalDays * 86400000)));
      arr.push({ x: Math.round(p * width), year: Y });
    }
    return arr;
  }, [padStart, padEnd, startMs, totalDays, width]);

  // animate thumb with CSS only
  const barRef = useRef<HTMLDivElement>(null);
  const [thumbX, setThumbX] = useState(0);
  useEffect(() => { setThumbX(Math.round(progress * width)); }, [progress, width]);

  return (
    <div className={styles.yearBarWrap} style={{ height, width }}>
      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={onPrevYear} aria-label="Previous year">‹</button>
      </div>

      <div className={styles.yearTrackArea}>
        {/* global track */}
        <div className={styles.yearTrack} ref={barRef} />

        {/* year ticks */}
        {ticks.map(t => (
          <div key={t.year} className={styles.yearTick} style={{ left: t.x }} title={`${t.year}`} />
        ))}

        {/* moving thumb */}
        <div className={styles.yearThumb} style={{ left: thumbX }} />

        {/* centered Year chip */}
        <div className={styles.yearCenterChip}>
          <div className={styles.yearLabel}>{y}</div>
          <div className={styles.yearSub}>
            {doy}/{daysInYear(y)}
          </div>
        </div>

        {/* cutoff cue near year end */}
        <div
          className={styles.yearCutoff}
          style={{ opacity: remain <= thresholdDays ? 1 : 0 }}
          title="Year boundary approaching"
        />
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={onNextYear} aria-label="Next year">›</button>
      </div>
    </div>
  );
}
