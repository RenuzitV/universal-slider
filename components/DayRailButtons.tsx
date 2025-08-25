// src/components/DayRailButtons.tsx
import React, {
  useEffect, useMemo, useRef, useState,
  forwardRef, useImperativeHandle
} from "react";
import { DAY_KEYS, modulo } from "./dateKeys";
import styles from "../styles/day-rail.module.css";

const ANIM_MS = 240;

export type DayRailHandle = {
  animateToKey: (key: string, opts?: { silent?: boolean }) => void;
};

type CSSHeight = number | string; // NEW

type Props = {
  valueKey: string;
  onChange: (key: string) => void;
  hasPOIKeys?: Set<string>;
  visibleCount?: number;
  onYearBoundary?: (deltaYear: number) => void;
  onPrevPoi?: () => void;
  onNextPoi?: () => void;
  extraPad?: number;
  minItemWidth?: number;
};

const DayRailButtons = forwardRef<DayRailHandle, Props>(function DayRailButtons(
  {
    valueKey,
    onChange,
    hasPOIKeys,
    visibleCount = 9,
    onYearBoundary,
    onPrevPoi,
    onNextPoi,
    extraPad = 6,
    minItemWidth = 76,
  },
  ref
) {
  const effectiveHeight = "100%"; // NEW

  const period = DAY_KEYS.length;
  const propIndex = Math.max(0, DAY_KEYS.indexOf(valueKey));

  const [animating, setAnimating] = useState(false);
  const [tx, setTx] = useState(0);
  const [internalCenterIdx, setInternalCenterIdx] = useState<number | null>(null);

  const renderCenter = internalCenterIdx ?? propIndex;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const lastW = useRef(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w !== lastW.current) {
        lastW.current = w;
        setContainerW(w);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const windowHalf = Math.floor(visibleCount / 2);
  const sliceHalf = windowHalf + extraPad;
  const itemCount = 2 * sliceHalf + 1;

  const rawItemWidth = containerW > 0 ? containerW / itemCount : minItemWidth;
  const itemWidth = Math.max(rawItemWidth, minItemWidth);
  const stripPixelWidth = itemCount * itemWidth;

  const tripled = useMemo(() => [...DAY_KEYS, ...DAY_KEYS, ...DAY_KEYS], []);
  const middle = period;
  const start = middle + renderCenter - sliceHalf;
  const end = middle + renderCenter + sliceHalf;
  const items = tripled.slice(start, end + 1);

  const toKey = (i: number) => DAY_KEYS[modulo(i, period)];

  const computeYearDelta = (baseCenter: number, steps: number) => {
    if (steps > 0 && baseCenter + steps >= period) return +1;
    if (steps < 0 && baseCenter + steps < 0) return -1;
    return 0;
  };

  const slideBySteps = (totalSteps: number, opts?: { silent?: boolean }) => {
    if (!totalSteps || animating) return;
    const sign = Math.sign(totalSteps);
    const abs = Math.abs(totalSteps);

    const baseCenter = renderCenter;
    const targetIdx = modulo(baseCenter + totalSteps, period);
    const yearDelta = computeYearDelta(baseCenter, totalSteps);
    const animSteps = Math.min(abs, windowHalf);

    const commit = (idx: number) => {
      setAnimating(false);
      setTx(0);
      setInternalCenterIdx(null);
      if (yearDelta && onYearBoundary) onYearBoundary(yearDelta);
      if (!opts?.silent) {
        const key = DAY_KEYS[idx];
        if (key !== valueKey) onChange(key);
      }
    };

    if (abs > animSteps) {
      const preIdx = modulo(targetIdx - sign * animSteps, period);
      setAnimating(false);
      setInternalCenterIdx(preIdx);
      setTx(-sign * animSteps * itemWidth);
      requestAnimationFrame(() => {
        setAnimating(true);
        setTx(0);
        window.setTimeout(() => commit(targetIdx), ANIM_MS);
      });
    } else {
      const nextIdx = modulo(baseCenter + sign * animSteps, period);
      setAnimating(true);
      setInternalCenterIdx(baseCenter);
      setTx(prev => prev - sign * animSteps * itemWidth);
      window.setTimeout(() => commit(nextIdx), ANIM_MS);
    }
  };

  const clickChip = (key: string) => {
    const target = DAY_KEYS.indexOf(key);
    if (target < 0 || target === renderCenter) return;
    let delta = target - renderCenter;
    delta = ((delta + period / 2) % period) - period / 2;
    slideBySteps(delta);
  };

  useImperativeHandle(ref, () => ({
    animateToKey: (key: string, opts?: { silent?: boolean }) => {
      const target = DAY_KEYS.indexOf(key);
      if (target < 0) return;
      let delta = target - renderCenter;
      delta = ((delta + period / 2) % period) - period / 2;
      if (delta === 0) return;
      slideBySteps(delta, { silent: opts?.silent ?? true });
    },
  }), [renderCenter, itemWidth, visibleCount, extraPad, valueKey]);

  const centerOffset =
    containerW > 0 ? containerW / 2 - (sliceHalf + 0.5) * itemWidth : 0;

  const stripStyle: React.CSSProperties = {
    height: "100%",                                  // NEW
    transform: `translateX(${centerOffset + tx}px)`,
    transition: animating ? `transform ${ANIM_MS}ms ease` : "none",
    willChange: "transform",
    width: stripPixelWidth,
    display: "flex",                                  // ← flex track
    alignItems: "center",
  };

  return (
    <div className={styles.railButtonsBar} style={{ height: effectiveHeight }}>
      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={() => slideBySteps(-1)} aria-label="Previous day">‹</button>
        <button className={styles.ctrlBtnSecondary} onClick={onPrevPoi} aria-label="Previous POI">•‹</button>
      </div>

      <div className={`${styles.railWrapper} ${styles.railWrapperStatic}`} style={{ height: "100%" }} ref={wrapRef}>
        <div className={styles.centerBand} />
        <div className={`${styles.rail} ${styles.railStatic}`} style={stripStyle}>
          {items.map((k, i) => {
            const key = k;
            const isActive = key === toKey(renderCenter);
            const has = hasPOIKeys?.has(key);

            const cls = isActive
              ? has ? `${styles.item} ${styles.itemActive} ${styles.itemActiveHas}`
                : `${styles.item} ${styles.itemActive}`
              : has ? `${styles.item} ${styles.itemHas}` : styles.item;

            return (
              <button
                type="button"
                key={`${key}-${i}`}
                className={cls}
                style={{ width: itemWidth, height: "70%" }}
                onClick={() => clickChip(key)}
                aria-pressed={isActive}
                data-has-poi={has ? "1" : "0"}
                aria-label={`Day ${key}${has ? " (has memory)" : ""}`}
              >
                {/* Centering wrapper: keeps label centered even if dot is shown */}
                <span className={styles.itemCenter}>
                  <span className={styles.label}>{key}</span>
                </span>

                {/* Dot is absolutely positioned so it doesn't shift the label */}
                {has && <span className={styles.dot} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <div className={styles.edgeMaskLeft} />
        <div className={styles.edgeMaskRight} />
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.ctrlBtn} onClick={() => slideBySteps(1)} aria-label="Next day">›</button>
        <button className={styles.ctrlBtnSecondary} onClick={onNextPoi} aria-label="Next POI">›•</button>
      </div>
    </div>
  );
});

export default DayRailButtons;
