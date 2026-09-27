/** Reports older than this are treated as stale (SPEC section 7 demo threshold). */
export const STALE_AFTER_HOURS = 12;

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

export function ageMs(timestamp: string, now: number): number {
  return Math.max(0, now - Date.parse(timestamp));
}

export function isStale(timestamp: string, now: number): boolean {
  return ageMs(timestamp, now) >= STALE_AFTER_HOURS * HOUR_MS;
}
