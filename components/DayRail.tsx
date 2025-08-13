import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { DAY_KEYS, modulo } from "./dateKeys";
import styles from "../styles/day-rail.module.css";

export default function DayRail({
  valueKey,
  onChange,
  hasPOIKeys,
  itemWidth = 76,
  height = 56,
}: {
  valueKey: string;
  onChange: (key: string) => void;
  hasPOIKeys?: Set<string>;
  itemWidth?: number;
  height?: number;
}) {
  const period = DAY_KEYS.length;
  const tripled = useMemo(() => [...DAY_KEYS, ...DAY_KEYS, ...DAY_KEYS], []);
  const middle = period;

  const railRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const centerToIndex = useCallback((idx: number) => {
    const el = railRef.current;
    if (!el) return;
    const centerOffset = (el.clientWidth - itemWidth) / 2;
    el.scrollLeft = idx * itemWidth - centerOffset;
  }, [itemWidth]);

  // initial center
  useEffect(() => {
    const startIdx = middle + Math.max(0, DAY_KEYS.indexOf(valueKey));
    const id = requestAnimationFrame(() => {
      centerToIndex(startIdx);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [valueKey, centerToIndex]);

  // keep centered on external value changes
  useEffect(() => {
    if (!ready) return;
    const idx = middle + DAY_KEYS.indexOf(valueKey);
    centerToIndex(idx);
  }, [valueKey, ready, centerToIndex]);

  // recenter on resize
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const idx = middle + DAY_KEYS.indexOf(valueKey);
      centerToIndex(idx);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [valueKey, centerToIndex]);

  const currentIndexFromScroll = (el: HTMLDivElement) => {
    const center = el.scrollLeft + (el.clientWidth - itemWidth) / 2;
    return Math.round(center / itemWidth);
  };

  const handleScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const i = currentIndexFromScroll(el);
    const iMod = modulo(i, period);
    const key = DAY_KEYS[iMod];
    if (key !== valueKey) onChange(key);

    // snap back to middle copy if drifting
    if (i < period * 0.5 || i > period * 2.5) {
      const newI = middle + iMod;
      requestAnimationFrame(() => centerToIndex(newI));
    }
  };

  // translate wheel to horizontal, always prevent default while over rail
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;
    e.preventDefault(); // avoid back/forward gestures
    el.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  };

  // drag-to-scroll
  const drag = useRef<{ active: boolean; x: number; scroll: number }>({ active: false, x: 0, scroll: 0 });
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { active: true, x: e.clientX, scroll: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    el.scrollLeft = drag.current.scroll - dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    drag.current.active = false;
  };

  return (
    <div className={styles.railWrapper} style={{ height }}>
      <div className={styles.centerBand} />
      <div
        ref={railRef}
        className={styles.rail}
        onScroll={handleScroll}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        tabIndex={0}
        style={{ height }}
      >
        {tripled.map((k, idx) => {
          const has = hasPOIKeys?.has(k);
          const active = ready && k === valueKey;
          const cls = active
            ? has ? `${styles.item} ${styles.itemActive} ${styles.itemActiveHas}` : `${styles.item} ${styles.itemActive}`
            : has ? `${styles.item} ${styles.itemHas}` : styles.item;
          return (
            <div
              key={`${k}-${idx}`}
              className={cls}
              style={{ width: itemWidth }}
              role="button"
              onClick={() => onChange(k)}
            >
              <span className={styles.label}>{k}</span>
              {has && <span className={styles.dot} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className={styles.edgeMaskLeft} />
      <div className={styles.edgeMaskRight} />
    </div>
  );
}
