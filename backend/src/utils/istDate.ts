// Single shared source of truth for IST (Asia/Kolkata, UTC+5:30) date math.
// The server runs in UTC (Render), but every user/lead is in IST - computing
// "today", day boundaries, or date-range filters in raw UTC shifts things by
// a day during the ~5.5h window each night (00:00-05:30 IST) where the UTC
// calendar date is still "yesterday". `new Date('YYYY-MM-DD')` always parses
// as UTC midnight regardless of server/browser timezone, so every date-range
// filter needs this conversion rather than raw Date math.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_TZ = 'Asia/Kolkata';

// The UTC instant corresponding to 00:00:00.000 IST on the given
// 'YYYY-MM-DD' calendar date - use as a Prisma `gte` bound.
export function istDayStartUTC(dateStr: string): Date {
  const utcMidnight = new Date(`${dateStr}T00:00:00.000Z`);
  return new Date(utcMidnight.getTime() - IST_OFFSET_MS);
}

// The UTC instant corresponding to 23:59:59.999 IST on the given
// 'YYYY-MM-DD' calendar date - use as a Prisma `lte` bound.
export function istDayEndUTC(dateStr: string): Date {
  return new Date(istDayStartUTC(dateStr).getTime() + 24 * 60 * 60 * 1000 - 1);
}

// Formats any Date/timestamp as its IST calendar date 'YYYY-MM-DD' - use to
// bucket records by IST day (e.g. trend charts) or to compare a record's
// date against a filter in the same calendar.
export function toISTDateKey(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}
