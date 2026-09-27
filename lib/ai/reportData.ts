import type { SupplyReport } from "@/lib/schemas";
import { ageMs, HOUR_MS, isStale } from "@/lib/staleness";

/**
 * A report as the models see it: the spec fields plus its age and a stale flag, so the
 * model can weigh old reports without doing date arithmetic on timestamps.
 */
export function reportWithAge(report: SupplyReport, now: number) {
  return {
    ...report,
    hours_since_update: Math.round((ageMs(report.timestamp, now) / HOUR_MS) * 10) / 10,
    stale: isStale(report.timestamp, now),
  };
}
