// src/components/DayRailButtons.tsx
import React, { useEffect, useMemo, useState } from "react";
import { DAY_KEYS, modulo } from "./dateKeys";
import styles from "../styles/day-rail.module.css";

type Props = {
  valueKey: string;
  onChange: (key: string) => void;
  hasPOIKeys?: Set<string>;
  itemWidth?: number;
  height?: number;
  visibleCount?: number;
  onYearBoundary?: (deltaYear: number) => void; // NEW
};

const ANIM_MS = 240;
const BUFFER = 3;

export default function DayRailButtons(props: Props) {
  const { valueKey, onChange, hasPOIKeys, itemWidth = 76, height = 56, visibleCount = 9, onYearBoundary } = props;

  const period = DAY_KEYS.length;
  const propIndex = Math.max(0, DAY_KEYS.indexOf(valueKey));
  const [centerIdx, setCenterIdx] = useState<number>(propIndex);

  // animation state
  const [tx, setTx] = useState(0);
  const [animating, setAnimating] = useState(false);

  // keep internal center in sync with external value when not animating
  useEffect(() => {
    if (!animating && propIndex !== centerIdx) {
      setCenterIdx(propIndex);
      setTx(0);
    }
  }, [propIndex, centerIdx, animating]);

  const windowHalf = Math.floor(visibleCount / 2);
  const sliceHalf = windowHalf + BUFFER; // constant buffer so width is constant

  // We triple the keys but slice a CONSTANT window around the center
  const tripled = useMemo(() => [...DAY_KEYS, ...DAY_KEYS, ...DAY_KEYS], []);
  const middle = period;
  const start = middle + centerIdx - sliceHalf;
  const end = middle + centerIdx + sliceHalf;
  const items = tripled.slice(start, end + 1); // constant length = 2*sliceHalf + 1

  const toKey = (i: number) => DAY_KEYS[modulo(i, period)];

  const poiIndices = useMemo(() => {
    const arr = Array.from(hasPOIKeys ?? new Set<string>())
      .map(k => DAY_KEYS.indexOf(k))
      .filter(i => i >= 0)
      .sort((a, b) => a - b);
    return arr;
  }, [hasPOIKeys]);

  // --- animation core ---
  // Perform a single slide with at most windowHalf steps; for bigger jumps,
  // we pre-position just off-center and animate a short slide (constant width).
  const slideBySteps = (totalSteps: number) => {
    if (!totalSteps || animating) return;
    const sign = Math.sign(totalSteps);
    const absSteps = Math.abs(totalSteps);
    const period = DAY_KEYS.length;
    const targetIdx = modulo(centerIdx + totalSteps, period);

    const applyYearBoundary = () => {
      if (!onYearBoundary) return;
      // If movement wraps across index 0→period-1 or vice versa, bump year:
      if (sign > 0 && centerIdx + absSteps >= period) onYearBoundary(+1);
      if (sign < 0 && centerIdx - absSteps < 0) onYearBoundary(-1);
    };

    if (absSteps > Math.min(absSteps, Math.floor(visibleCount / 2))) {
      const animSteps = Math.floor(visibleCount / 2);
      const preIdx = modulo(targetIdx - sign * animSteps, period);
      setAnimating(false);
      setCenterIdx(preIdx);
      setTx(-sign * animSteps * itemWidth);
      requestAnimationFrame(() => {
        setAnimating(true);
        setTx(0);
        window.setTimeout(() => {
          setAnimating(false);
          setCenterIdx(targetIdx);
          setTx(0);
          applyYearBoundary();
          onChange(DAY_KEYS[targetIdx]);
        }, ANIM_MS);
      });
    } else {
      // SMALL MOVE branch:
      const animSteps = absSteps;
      setAnimating(true);
      setTx(prev => prev - sign * animSteps * itemWidth);
      window.setTimeout(() => {
        setAnimating(false);
        const newIdx = modulo(centerIdx + sign * animSteps, period);
        setCenterIdx(newIdx);
        setTx(0);
        applyYearBoundary();
        onChange(DAY_KEYS[newIdx]);
      }, ANIM_MS);
    }
  };

  // buttons
  const nextDay = () => slideBySteps(1);
  const prevDay = () => slideBySteps(-1);

  const nextPoi = () => {
    if (!poiIndices.length) return nextDay();
    const next = poiIndices.find(i => i > centerIdx) ?? poiIndices[0];
    const steps = modulo(next - centerIdx, period); // 1..period-1
    slideBySteps(steps);
  };

  const prevPoi = () => {
    if (!poiIndices.length) return prevDay();
    const prev = [...poiIndices].reverse().find(i => i < centerIdx) ?? poiIndices[poiIndices.length - 1];
    const steps = -modulo(centerIdx - prev, period); // negative 1..period-1
    slideBySteps(steps);
  };

  // clicking a chip: shortest direction
  const clickChip = (key: string) => {
    const target = DAY_KEYS.indexOf(key);
    if (target < 0 || target === centerIdx) return;
    let delta = target - centerIdx;
    // map to shortest signed distance on a ring
    delta = ((delta + period / 2) % period) - period / 2; // (-period/2, period/2]
    slideBySteps(delta);
  };

  const stripStyle: React.CSSProperties = {
    height,
    transform: `translateX(${tx}px)`,
    transition: animating ? `transform ${ANIM_MS}ms ease` : "none",
    willChange: "transform",
  };

  return (
    <div className={styles.railButtonsBar} style={{ height }}>
      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={prevDay} aria-label="Previous day">‹</button>
        <button className={styles.ctrlBtnSecondary} onClick={prevPoi} aria-label="Previous POI">•‹</button>
      </div>

      <div className={`${styles.railWrapper} ${styles.railWrapperStatic}`} style={{ height }}>
        <div className={styles.centerBand} />
        <div className={`${styles.rail} ${styles.railStatic}`} style={stripStyle}>
          {items.map((k, i) => {
            const key = k; // already a day key
            const isActive = key === toKey(centerIdx);
            const has = hasPOIKeys?.has(key);
            const cls = isActive
              ? has ? `${styles.item} ${styles.itemActive} ${styles.itemActiveHas}` : `${styles.item} ${styles.itemActive}`
              : has ? `${styles.item} ${styles.itemHas}` : styles.item;

            return (
              <div
                key={`${key}-${i}`}
                className={cls}
                style={{ width: itemWidth, textAlign: "center" }}
                role="button"
                onClick={() => clickChip(key)}
              >
                <span className={styles.label}>{key}</span>
                {has && <span className={styles.dot} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
        <div className={styles.edgeMaskLeft} />
        <div className={styles.edgeMaskRight} />
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={nextDay} aria-label="Next day">›</button>
        <button className={styles.ctrlBtnSecondary} onClick={nextPoi} aria-label="Next POI">›•</button>
      </div>
    </div>
  );
}
