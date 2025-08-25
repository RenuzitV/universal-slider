// src/components/SolarSystem.tsx
import { createPortal } from "react-dom";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { DefaultSolarBodies, SolarBodyConfig, Sun } from "./SolarBodies";
import { EphemerisPoint } from "../pages/api/earth-orbit";
import { CreateSun } from "./Sun";
import { POILayer } from "./POILayer";
import DayRailButtons, { DayRailHandle } from "./DayRailButtons";
import YearProgressRail from "./YearProgressRail";
import OrbitPath from "./OrbitPath";
import EarthMarker from "./EarthMarker";
import { PointOfInterest } from "./pointOfInterest";
import POIGallery from "./POIGallery";
import layout from "../styles/solar-layout.module.css";
import actionStyles from "../styles/action-button.module.css";
import { useIsDomReady } from "../utils/useIsDomReady";
import { fetchPOIs } from "../lib/api";
import POIForm from "./POIForm";
import BodyPortal from "./BodyPortal";
import next from "next";

const MAX_COORD = 1000;

// helpers
const byDateAsc = (a: PointOfInterest, b: PointOfInterest) => a.date.getTime() - b.date.getTime();
const isSameYMD = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toDayKeyLocal = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromDayKeyLocal = (key: string, year: number) => {
  const [m, d] = key.split("-").map(Number);
  return new Date(year, m - 1, d); // local midnight
};

export default function SolarSystem() {
  // fetch orbits once, then scale/annotate
  const [rawBodies] = useState<SolarBodyConfig[]>(DefaultSolarBodies);
  const [fetchedBodies, setFetchedBodies] = useState<SolarBodyConfig[]>([]);
  const [earth, setEarth] = useState<SolarBodyConfig | null>(
    DefaultSolarBodies.find(b => b.name === "Earth")!
  );
  const hasFetched = useRef(false);

  const dayRailRef = useRef<DayRailHandle>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPoi, setEditingPoi] = useState<PointOfInterest | undefined>(undefined);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const fetched = await Promise.all(
          rawBodies.map(async (body: SolarBodyConfig) => {
            if (!body.orbitApi) throw new Error(`orbitApi is required for ${body.name}`);
            const res = await fetch(body.orbitApi);
            const orbitPoints = (await res.json()) as EphemerisPoint[];
            return { ...body, orbitTrajectory: orbitPoints };
          })
        );
        const [scaled] = rescaleOrbits(fetched);
        setFetchedBodies(scaled);
        setEarth(scaled.find(b => b.name === "Earth")!);
      } catch (err) {
        console.error("Failed to fetch orbits:", err);
      }
    })();
  }, [rawBodies]);

  const domReady = useIsDomReady();

  const onSaved = (saved: PointOfInterest) => {
    setPois(prev => {
      const i = prev.findIndex(p => p.id === saved.id);
      const next = i >= 0 ? prev.map(p => (p.id === saved.id ? saved : p)) : [...prev, saved];
      return next.sort((a, b) => a.date.getTime() - b.date.getTime());
    });
    setSelectedDate(saved.date);      // optional: jump to the saved day
  };

  // POIs (sorted)
  // ---- POIs (from API) ----
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [poiCursor, setPoiCursor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // load once on mount
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchPOIs();

        // Normalize wire DTO → internal type (Date + imageURLs string[])
        const normalized: PointOfInterest[] = data
          .map(d => ({
            id: d.id,
            date: new Date(d.date),
            title: d.title,
            description: d.description,
            imageURLs: d.imageURLs ?? [],
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (!alive) return;

        setPois(normalized);

        // initial cursor: latest POI ≤ today, else last
        const now = Date.now();
        const idx =
          normalized.findLastIndex?.(p => p.date.getTime() <= now) ??
          (() => { // tiny polyfill for findLastIndex
            for (let i = normalized.length - 1; i >= 0; i--) {
              if (normalized[i].date.getTime() <= now) return i;
            }
            return -1;
          })();

        const initialIdx = idx >= 0 ? idx : normalized.length - 1;
        setPoiCursor(normalized.length ? initialIdx : null);
        setSelectedDate(normalized.length ? normalized[initialIdx].date : new Date());
      } catch (e) {
        console.error("Failed to fetch POIs", e);
        // Optional: keep selectedDate as today and leave pois empty
      }
    })();

    return () => { alive = false; };
  }, []);

  // fast id→index map for lookups
  const idToIndex = useMemo(() => {
    const m = new Map<string, number>();
    pois.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [pois]);

  const currentYear = selectedDate.getFullYear();
  const currentDayKey = toDayKeyLocal(selectedDate);
  const selectedPoiId = poiCursor != null ? pois[poiCursor].id : null;

  // years & 1-year padding
  const yearsWithPOIs = useMemo(() => {
    const s = new Set<number>();
    pois.forEach(p => s.add(p.date.getFullYear()));
    return Array.from(s).sort((a, b) => a - b);
  }, [pois]);

  const minYear = yearsWithPOIs[0] ?? new Date().getFullYear();
  const maxYear = yearsWithPOIs[yearsWithPOIs.length - 1] ?? minYear;
  const navMinYear = minYear - 1;
  const navMaxYear = maxYear + 1;

  // jump to a specific POI (date + cursor + animate rail)
  const jumpToPoi = (idx: number) => {
    if (idx < 0 || idx >= pois.length) return;
    const k = toDayKeyLocal(pois[idx].date);

    // update date (rails/Earth), cursor (selection), and animate the rail
    setSelectedDate(pois[idx].date);
    setPoiCursor(idx);
    dayRailRef.current?.animateToKey(k, { silent: true });
  };


  // next/prev POI relative to selected day + current cursor (tie-break on same day)
  const nextPoi = () => {
    const i = pois.findIndex(
      p =>
        p.date.getTime() > selectedDate.getTime() ||
        (p.date.getTime() === selectedDate.getTime() && poiCursor != null && pois.indexOf(p) > poiCursor)
    );
    jumpToPoi(i); // no-op if i === -1
  };

  const prevPoi = () => {
    // use findLastIndex (Node/modern browsers); if needed, replace with a reverse loop
    // @ts-ignore
    const i = pois.findLastIndex(
      (p: typeof pois[number]) =>
        p.date.getTime() < selectedDate.getTime() ||
        (p.date.getTime() === selectedDate.getTime() && poiCursor != null && pois.indexOf(p) < poiCursor)
    );
    if (i >= 0) jumpToPoi(i);
  };

  const handleDeletedPoi = (id: string) => {
    setPois(prev => {
      const next = prev.filter(p => p.id !== id).sort(byDateAsc);
      return next;
    });
  };

  // day rail: pending year delta (for Dec↔Jan wrap)
  const pendingYearDeltaRef = useRef(0);
  const bumpYear = (delta: number) => {
    pendingYearDeltaRef.current += delta;
  };

  // set day from rail
  const setDayKey = (k: string) => {
    const y = selectedDate.getFullYear() + pendingYearDeltaRef.current;
    pendingYearDeltaRef.current = 0;
    const d = fromDayKeyLocal(k, y);
    setSelectedDate(d);

    // if there is a POI on that day/year, pick the first one; else clear selection
    const sameDayIdx = pois.findIndex(
      p => p.date.getFullYear() === y && toDayKeyLocal(p.date) === k
    );
    setPoiCursor(sameDayIdx >= 0 ? sameDayIdx : null);
  };

  // year stepper with ±1 padding; pick extreme POI in that year if available
  const changeYearStep = (dir: 1 | -1) => {
    const targetYear = Math.max(navMinYear, Math.min(navMaxYear, currentYear + dir));
    if (targetYear === currentYear) return;

    const k = currentDayKey;
    const d = fromDayKeyLocal(k, targetYear);
    setSelectedDate(d);

    const firstInY = pois.findIndex(p => p.date.getFullYear() === targetYear);
    let lastInY = -1;
    for (let i = pois.length - 1; i >= 0; i--) {
      if (pois[i].date.getFullYear() === targetYear) { lastInY = i; break; }
    }
    const pick = dir > 0 ? lastInY : firstInY;
    if (pick >= 0) {
      jumpToPoi(pick); // will animate the rail and set cursor
    } else {
      // empty year: keep cursor null, animate rail to same MM-DD in that year
      dayRailRef.current?.animateToKey(k, { silent: true });
      setPoiCursor(null);
    }
  };

  // day-rail dots for current year
  const hasPOIKeys = useMemo(() => {
    const s = new Set<string>();
    pois
      .filter(p => p.date.getFullYear() === currentYear)
      .forEach(p => s.add(toDayKeyLocal(p.date)));
    return s;
  }, [pois, currentYear]);
  const currentDayHasPoi = useMemo(
    () => pois.some(p => isSameYMD(p.date, selectedDate)),
    [pois, selectedDate]
  );

  // If editing, which POI? Prefer the cursor if it matches the day; else first POI that day.
  const poiForEdit = useMemo(() => {
    if (!pois.length) return undefined;
    if (poiCursor != null && pois[poiCursor] && isSameYMD(pois[poiCursor].date, selectedDate)) {
      return pois[poiCursor];
    }
    return pois.find(p => isSameYMD(p.date, selectedDate)) ?? undefined;
  }, [pois, poiCursor, selectedDate]);

  // Open create on selected day
  const onCreate = () => {
    setEditingPoi(undefined);
    setFormOpen(true);
  };

  // Open edit on that day's POI
  const onEdit = () => {
    if (!poiForEdit) return;
    setEditingPoi(poiForEdit);
    setFormOpen(true);
  };

  // Jump to today (update selectedDate + animate rail)
  const onToday = () => {
    const now = new Date();
    setSelectedDate(now);
    const k = toDayKeyLocal(now);
    dayRailRef.current?.animateToKey(k, { silent: true });
  };

  // When a POI is saved (create or edit), refresh local list and jump to its day
  const onSavedPoi = (saved: PointOfInterest) => {
    setPois(prev => {
      const i = prev.findIndex(p => p.id === saved.id);
      const next = i >= 0 ? prev.map(p => (p.id === saved.id ? saved : p)) : [...prev, saved];
      return next.sort((a, b) => a.date.getTime() - b.date.getTime());
    });
    setSelectedDate(saved.date);
    dayRailRef.current?.animateToKey(toDayKeyLocal(saved.date), { silent: true });
  };

  // earth body (prefer fetched)
  const earthBody: SolarBodyConfig | null =
    (fetchedBodies.find(b => b.name === "Earth") as SolarBodyConfig | undefined) ?? earth ?? null;

  const [galleryPoi, setGalleryPoi] = useState<PointOfInterest | null>(null);
  const openGallery = (poi: PointOfInterest) => setGalleryPoi(poi);
  const closeGallery = () => setGalleryPoi(null);

  return (
    <div className={layout.appColumn}>
      <div className={`${layout.topBar} ${layout.yearBar}`}>
        <YearProgressRail
          selectedDate={selectedDate}
          minYear={minYear}
          maxYear={maxYear}
          onPrevYear={() => changeYearStep(-1)}
          onNextYear={() => changeYearStep(+1)}
        />
      </div>


      <div className={layout.topBar}>
        <DayRailButtons
          ref={dayRailRef}
          valueKey={currentDayKey}
          onChange={setDayKey}
          hasPOIKeys={hasPOIKeys}
          visibleCount={9}
          onYearBoundary={bumpYear}
          onPrevPoi={prevPoi}
          onNextPoi={nextPoi}
        />
      </div>

      {/* Actions row under the day rail */}
      <div className={actionStyles.actionsBar}>
        {/* Left: Create (only when NOT on a POI) */}
        <div className={actionStyles.slotLeft}>
          <div className={`${actionStyles.wrap} ${currentDayHasPoi ? actionStyles.hidden : actionStyles.visible}`}>
            <button className={`${actionStyles.actionBtn} ${actionStyles.primary}`} onClick={onCreate}>
              ＋ Create
            </button>
          </div>
        </div>

        {/* Center: Today (always) */}
        <div className={actionStyles.slotCenter}>
          <div className={`${actionStyles.wrap} ${actionStyles.visible}`}>
            <button className={actionStyles.actionBtn} onClick={onToday}>Today</button>
          </div>
        </div>

        {/* Right: Edit (only when ON a POI) */}
        <div className={actionStyles.slotRight}>
          <div className={`${actionStyles.wrap} ${currentDayHasPoi ? actionStyles.visible : actionStyles.hidden}`}>
            <button className={actionStyles.actionBtn} onClick={onEdit} disabled={!poiForEdit}>
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className={layout.canvasWrap}>
        <svg
          className={layout.solarSystem}
          viewBox={`${-MAX_COORD} ${-MAX_COORD} ${MAX_COORD * 2} ${MAX_COORD * 2}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <CreateSun sun={Sun} />

          {earthBody?.orbitTrajectory?.length ? (
            <>
              <OrbitPath earth={earthBody} />
              <EarthMarker earth={earthBody} dayKey={currentDayKey} />
              <POILayer
                earth={earthBody}
                pois={pois}
                currentYear={currentYear}
                selectedDayKey={currentDayKey}
                selectedPoiId={selectedPoiId}
                onSelectPoi={(id) => {
                  if (id == null) {
                    // clear selection
                    setPoiCursor(null);
                    return;
                  }
                  const i = idToIndex.get(id);
                  if (i != null) jumpToPoi(i);
                }}
                onOpenGallery={openGallery}
              />

            </>
          ) : null}
        </svg>

        {galleryPoi && (
          <BodyPortal>
            <POIGallery poi={galleryPoi} open onClose={() => setGalleryPoi(null)} />
          </BodyPortal>
        )}

        {formOpen && (
          <BodyPortal>
            <POIForm
              open={formOpen}
              onClose={() => setFormOpen(false)}
              onSaved={onSavedPoi}
              onDeleted={handleDeletedPoi}
              poi={editingPoi}
              initialDate={editingPoi ? undefined : selectedDate}  /* prefills create with selected day */
            />
          </BodyPortal>
        )}
      </div>
    </div>
  );
}

function rescaleOrbits(bodies: SolarBodyConfig[]): [SolarBodyConfig[], number] {
  const allDistances: number[] = [];
  bodies.forEach(body => {
    const points = body.orbitTrajectory as (EphemerisPoint & { radial?: number })[] | undefined;
    if (points?.length) {
      for (const pt of points) {
        const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
        allDistances.push(dist);
      }
    }
  });

  const modeDist = getMode(allDistances, 1e7);
  if (modeDist <= 0) return [bodies, 0];

  const scale = (MAX_COORD / modeDist) * 0.7;

  bodies.forEach(body => {
    const points = body.orbitTrajectory as (EphemerisPoint & { radial?: number })[] | undefined;
    if (!points) return;
    points.forEach(pt => {
      pt.x *= scale;
      pt.y *= scale;
    });
    points.forEach(pt => {
      pt.radial = Math.atan2(pt.y, pt.x);
      // normalize date if API returns strings
      // @ts-ignore
      if (pt.date && typeof pt.date === "string") pt.date = new Date(pt.date);
    });
  });

  return [bodies, scale];
}

function getMode(distances: number[], binSize: number = 1e7) {
  const bins = new Map<number, number>();
  for (const d of distances) {
    const b = Math.round(d / binSize) * binSize;
    bins.set(b, (bins.get(b) || 0) + 1);
  }
  let mode = 0, maxCount = 0;
  for (const [b, count] of bins) {
    if (count > maxCount) { maxCount = count; mode = b; }
  }
  return mode;
}

function findCursorForDate(arr: PointOfInterest[], date: Date): number | null {
  if (!arr.length) return null;
  let dist = 1e18;
  let nextIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i].date.getTime() - date.getTime());
    if (d === 0) return i;
    if (d < dist) {
      dist = d;
      nextIdx = i;
    }
  }
  return nextIdx == -1 ? null : nextIdx;
}

