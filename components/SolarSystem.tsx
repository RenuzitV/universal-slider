// src/components/SolarSystem.tsx
import { createPortal } from "react-dom";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { DefaultSolarBodies, SolarBodyConfig, Sun } from "./SolarBodies";
import { defaultPOIs } from "./pointOfInterest";
import { EphemerisPoint } from "../pages/api/earth-orbit";
import { CreateSun } from "./Sun";
import { POILayer } from "./POILayer";
import DayRailButtons, { DayRailHandle } from "./DayRailButtons";
import YearProgressRail from "./YearProgressRail";
import OrbitPath from "./OrbitPath";
import EarthMarker from "./EarthMarker";
import { sortPOIs } from "./poiData";
import { PointOfInterest } from "./pointOfInterest";
import POIGallery from "./POIGallery";
import layout from "../styles/solar-layout.module.css";
import { useIsDomReady } from "../utils/useIsDomReady";

const MAX_COORD = 1000;

// helpers
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

  // POIs (sorted)
  const pois = useMemo(() => sortPOIs(defaultPOIs), []);
  const idToIndex = useMemo(() => {
    const m = new Map<string, number>();
    pois.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [pois]);

  // selection state
  const [poiCursor, setPoiCursor] = useState<number | null>(pois.length - 1);
  const [selectedDate, setSelectedDate] = useState<Date>(poiCursor != null ? pois[poiCursor].date : new Date());

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

  // day rail ref (for programmatic animation)
  const dayRailRef = useRef<DayRailHandle>(null);

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


      <div className={`${layout.topBar} ${layout.dayBar}`}>
        <DayRailButtons
          ref={dayRailRef}
          valueKey={currentDayKey}
          onChange={setDayKey}
          hasPOIKeys={hasPOIKeys}
          visibleCount={9}
          onYearBoundary={bumpYear}
          onPrevPoi={prevPoi}
          onNextPoi={nextPoi}
        /* keep your itemWidth='2.97vw' on the chip buttons */
        />
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

        {domReady && typeof document !== "undefined" && document.body
          ? createPortal(
            <POIGallery poi={galleryPoi} open={!!galleryPoi} onClose={() => setGalleryPoi(null)} />,
            document.body
          )
          : null}
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
