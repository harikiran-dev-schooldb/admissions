/** Fixed UTC+05:30 school-day boundaries, independent of a staff device's timezone. */
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function indiaTodayBounds(now: Date = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Invalid date");
  const startMs = Math.floor((now.getTime() + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS;
  return { start: new Date(startMs), tomorrow: new Date(startMs + DAY_MS) };
}
