// src/components/SolarSystem.tsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { CreateSolarBodies, DefaultSolarBodies, SolarBodyConfig, Sun } from "./solarBodies";
import { defaultPOIs } from "./pointOfInterest";
import { EphemerisPoint } from "../pages/api/earth-orbit";
import { CreateSun } from "./Sun";
import { POILayer } from "./POILayer";
import { dayKey } from "./dateKeys";
import styles from "../styles/solar-system.module.css";
import YearRailButtons from "./YearRailButtons";
import DayRailButtons from "./DayRailButtons";
import { fromDayKeySafe } from "./dateRange";
import YearProgressRail from "./YearProgressRail";

const MAX_COORD = 1000;


export default function SolarSystem() {
  const width = useWindowWidth();
  const aspect = 20 / 10;
  const height = width / aspect;
  const centerX = width / 2;
  const centerY = height / 2;

  const [rawBodies] = useState<SolarBodyConfig[]>(DefaultSolarBodies);
  const [fetchedBodies, setFetchedBodies] = useState<SolarBodyConfig[]>([]);
  const [earth, setEarth] = useState<SolarBodyConfig | null>(
    DefaultSolarBodies.find(b => b.name === "Earth")!
  );
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchOrbits = async () => {
      try {
        const fetched = await Promise.all(
          rawBodies.map(async (body: SolarBodyConfig) => {
            if (!body.orbitApi) throw new Error(`orbitApi is required for ${body.name}`);
            const res = await fetch(body.orbitApi);
            const orbitPoints = (await res.json()) as EphemerisPoint[];
            return { ...body, orbitTrajectory: orbitPoints };
          })
        );

        // scale + annotate radial
        const [scaled] = rescaleOrbits(fetched, width, height);

        setFetchedBodies(scaled);
        setEarth(scaled.find(b => b.name === "Earth")!);
      } catch (err) {
        console.error("Failed to fetch orbits:", err);
      }
    };

    fetchOrbits();
  }, [rawBodies, width, height]);

  const allYears = useMemo(() => {
    const ys = new Set<number>();
    defaultPOIs.forEach(p => ys.add(p.date.getFullYear()));
    const minY = Math.min(...Array.from(ys));
    const maxY = Math.max(...Array.from(ys));
    return { minY, maxY };
  }, []);

  // All years present in data (sorted)
  const years = useMemo(() => {
    const ys = new Set<number>();
    defaultPOIs.forEach(p => ys.add(p.date.getFullYear()));
    return Array.from(ys).sort((a, b) => a - b);
  }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // use today as start

  // derive current year + dayKey
  const currentYear = selectedDate.getFullYear();
  const currentDayKey = useMemo(() => {
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${m}-${d}`;
  }, [selectedDate]);


  const setDayKey = (k: string) => setSelectedDate(fromDayKeySafe(k, currentYear));
  const bumpYear = (delta: number) => {
    const y = currentYear + delta;
    setSelectedDate(fromDayKeySafe(currentDayKey, y));
  };

  // Day keys that have POIs in the selected year (for highlighting the day rail)
  const poiDayKeysForYear = useMemo(() => {
    const s = new Set<string>();
    defaultPOIs
      .filter(p => p.date.getFullYear() === currentYear) // ← was selectedYear
      .forEach(p => s.add(dayKey(p.date)));
    return s;
  }, [currentYear]);


  return (
    <div className={styles.appColumn}>
      {/* Year progress over full range with ±1 padding implicitly */}
      <div className={styles.topBar}>
        <YearProgressRail
          selectedDate={selectedDate}
          minYear={allYears.minY}
          maxYear={allYears.maxY}
          onPrevYear={() => bumpYear(-1)}
          onNextYear={() => bumpYear(+1)}
          width={720}
          height={54}
        />
      </div>

      {/* Day rail (month-day ring). Crossing Dec31/Jan1 bumps year. */}
      <div className={styles.topBar}>
        <DayRailButtons
          valueKey={currentDayKey}
          onChange={setDayKey}
          hasPOIKeys={poiDayKeysForYear}
          itemWidth={76}
          height={56}
          visibleCount={9}
          onYearBoundary={bumpYear}     // << new
        />
      </div>

      <div className={styles.canvasWrap}>
        <div className={styles.canvasWrap}>
          <svg
            width={width}
            height={height}
            className={styles.solarSystem}
            viewBox={`${-MAX_COORD} ${-MAX_COORD} ${MAX_COORD * 2} ${MAX_COORD * 2}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* viewBox is centered at (0,0) → place the Sun at (0,0) */}
            <CreateSun x={0} y={0} sun={Sun} />
            <CreateSolarBodies bodies={fetchedBodies} />
            {earth && earth.orbitTrajectory && (
              <POILayer
                earth={earth}
                pois={defaultPOIs}
                currentYear={currentYear}
                selectedDayKey={currentDayKey}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

function useWindowWidth() {
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1600);
  useEffect(() => {
    function handleResize() { setWidth(window.innerWidth); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

function rescaleOrbits(
  bodies: SolarBodyConfig[],
  width: number,
  height: number,
): [SolarBodyConfig[], number] {
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
      pt.x = pt.x * scale;
      pt.y = pt.y * scale;
    });
    // annotate a radial angle once (outward normal direction)
    points.forEach(pt => {
      pt.radial = Math.atan2(pt.y, pt.x);
      // ensure pt.date is a Date if your API returns ISO strings:
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
