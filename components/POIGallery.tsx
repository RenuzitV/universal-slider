// src/components/POIGallery.tsx
import React, { useEffect, useRef, useState } from "react";
import type { PointOfInterest } from "./pointOfInterest";
import g from "../styles/gallery.module.css";

export default function POIGallery({
  poi,
  open,
  onClose,
}: {
  poi: PointOfInterest | null;
  open: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchDx = useRef(0);

  useEffect(() => { setIdx(0); }, [poi?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !poi) return null;

  const imgs = poi.imageURLs ?? [];
  const clamp = (n: number) => Math.max(0, Math.min(n, imgs.length - 1));
  const next = () => setIdx((i) => clamp(i + 1));
  const prev = () => setIdx((i) => clamp(i - 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDx.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    touchDx.current = e.touches[0].clientX - touchStart.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDx.current) > 40) {
      if (touchDx.current < 0) next();
      else prev();
    }
    touchStart.current = null;
    touchDx.current = 0;
  };

  // truncate description to a few words with CSS line clamp; keep a simple fallback
  const fullDesc = poi.description ?? "";
  const shortDesc = fullDesc;

  return (
    <div className={g.overlay} onClick={onClose}>
      <div className={g.panel} onClick={(e) => e.stopPropagation()}>
        <div className={g.domino}>
          {/* Left square panel: info */}
          <div className={g.infoPanel}>
            <div className={g.infoInner}>
              <div className={g.infoTitle} title={poi.title}>{poi.title}</div>
              <div className={g.infoDate}>
                {poi.date.toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Australia/Melbourne",
                })}
              </div>
              <textarea readOnly className={g.infoDesc} title={fullDesc}>{shortDesc}</textarea>
              {imgs.length > 0 && <div className={g.infoCount}>🖼️ +{imgs.length}</div>}
            </div>
          </div>

          {/* Right square panel: carousel */}
          <div
            className={g.galleryPanel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {imgs.length > 0 ? (
              <>
                <img key={imgs[idx]} src={imgs[idx]} alt="" className={g.img} />
                <button className={`${g.nav} ${g.left}`} onClick={prev} aria-label="Previous photo">‹</button>
                <button className={`${g.nav} ${g.right}`} onClick={next} aria-label="Next photo">›</button>
                <div className={g.counter}>{idx + 1}/{imgs.length}</div>
              </>
            ) : (
              <div className={g.empty}>No photos.</div>
            )}
          </div>
        </div>
        <button className={g.close} onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  );
}
