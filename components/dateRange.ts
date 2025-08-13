// src/components/dateRange.ts
export const startOfYear = (y: number) => new Date(Date.UTC(y, 0, 1));
export const endOfYear   = (y: number) => new Date(Date.UTC(y, 11, 31));
export const daysInYear  = (y: number) => Math.floor((startOfYear(y+1).getTime()-startOfYear(y).getTime())/86400000);
export const dayOfYear = (d: Date) => {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - y)/86400000) + 1; // 1..365/366
};

// Safer "MM-DD" -> Date in given year (handles 02-29 in non-leap)
export const fromDayKeySafe = (key: string, year: number) => {
  const [m, d] = key.split("-").map(Number);
  const tryDt = new Date(Date.UTC(year, m-1, d));
  if (tryDt.getUTCFullYear() === year && tryDt.getUTCMonth() === m-1 && tryDt.getUTCDate() === d) return tryDt;
  // fallback for 02-29 in non-leap years → 02-28
  return new Date(Date.UTC(year, m-1, Math.min(d, 28)));
};
