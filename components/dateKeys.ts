// src/components/dateKeys.ts
export const dayKey = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromDayKey = (key: string, year = new Date().getFullYear()) => {
  const [m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, d));
};

export const DAY_KEYS = (() => {
  const base = new Date(Date.UTC(2025, 0, 1));
  const arr: string[] = [];
  for (let i = 0; i < 366; i++) {
    const dt = new Date(base.getTime() + i * 86400000);
    arr.push(dayKey(dt));
  }
  // de-dup Dec 31 in non-leap years
  return Array.from(new Set(arr));
})();

export const modulo = (n: number, m: number) => ((n % m) + m) % m;

export const cyclicDistance = (aIdx: number, bIdx: number, period: number) => {
  const diff = Math.abs(aIdx - bIdx) % period;
  return Math.min(diff, period - diff);
};
