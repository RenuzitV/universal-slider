// src/components/YearRailButtons.tsx
import React, { useMemo, useState, useEffect } from "react";
import styles from "../styles/day-rail.module.css"; // reuse styles

const ANIM_MS = 200;
const BUFFER = 2;

export default function YearRailButtons({
  years,                // e.g. [2023, 2024, 2025]
  valueYear,            // current selected year
  onChange,
  itemWidth = 84,
  height = 48,
  visibleCount = 7,     // keep odd
}: {
  years: number[];
  valueYear: number;
  onChange: (y: number) => void;
  itemWidth?: number;
  height?: number;
  visibleCount?: number;
}) {
  const period = years.length;
  const idxOf = (y: number) => Math.max(0, years.indexOf(y));
  const toYear = (i: number) => years[(i % period + period) % period];

  const propIndex = idxOf(valueYear);
  const [centerIdx, setCenterIdx] = useState(propIndex);
  const [tx, setTx] = useState(0);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    if (!anim && propIndex !== centerIdx) {
      setCenterIdx(propIndex);
      setTx(0);
    }
  }, [propIndex, centerIdx, anim]);

  const winHalf = Math.floor(visibleCount / 2);
  const sliceHalf = winHalf + BUFFER;
  const start = centerIdx - sliceHalf;
  const end   = centerIdx + sliceHalf;

  // window of constant length
  const items = useMemo(() => {
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(toYear(i));
    return arr;
  }, [start, end, years.join(",")]);

  const slideSteps = (steps: number) => {
    if (!steps || anim) return;
    const sign = Math.sign(steps);
    const abs  = Math.abs(steps);
    const animSteps = Math.min(abs, winHalf);
    const targetIdx = (centerIdx + steps) % period;

    if (abs > animSteps) {
      const preIdx = (targetIdx - sign * animSteps + period) % period;
      setAnim(false);
      setCenterIdx(preIdx);
      setTx(-sign * animSteps * itemWidth);
      requestAnimationFrame(() => {
        setAnim(true);
        setTx(0);
        setTimeout(() => {
          setAnim(false);
          setCenterIdx(targetIdx);
          setTx(0);
          onChange(toYear(targetIdx));
        }, ANIM_MS);
      });
    } else {
      setAnim(true);
      setTx(-sign * animSteps * itemWidth);
      setTimeout(() => {
        setAnim(false);
        const newIdx = (centerIdx + sign * animSteps + period) % period;
        setCenterIdx(newIdx);
        setTx(0);
        onChange(toYear(newIdx));
      }, ANIM_MS);
    }
  };

  const prev = () => slideSteps(-1);
  const next = () => slideSteps(1);

  const clickChip = (y: number) => {
    const t = idxOf(y);
    let delta = t - centerIdx;
    // shortest path on ring
    delta = ((delta + period / 2) % period) - period / 2;
    slideSteps(delta);
  };

  const stripStyle: React.CSSProperties = {
    height,
    transform: `translateX(${tx}px)`,
    transition: anim ? `transform ${ANIM_MS}ms ease` : "none",
    willChange: "transform",
  };

  return (
    <div className={styles.railButtonsBar} style={{ height }}>
      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={prev} aria-label="Previous year">‹</button>
      </div>

      <div className={`${styles.railWrapper} ${styles.railWrapperStatic}`} style={{ height }}>
        <div className={styles.centerBand} />
        <div className={`${styles.rail} ${styles.railStatic}`} style={stripStyle}>
          {items.map((y, i) => {
            const isActive = y === toYear(centerIdx);
            const cls = isActive ? `${styles.item} ${styles.itemActive}` : styles.item;
            return (
              <div
                key={`${y}-${i}`}
                className={cls}
                style={{ width: itemWidth, textAlign: "center" }}
                role="button"
                onClick={() => clickChip(y)}
              >
                <span className={styles.label}>{y}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.edgeMaskLeft} />
        <div className={styles.edgeMaskRight} />
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={next} aria-label="Next year">›</button>
      </div>
    </div>
  );
}
