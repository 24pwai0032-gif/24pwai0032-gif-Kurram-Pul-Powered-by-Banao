import type { AreaRecord, SeedReports, TriageCaseRecord } from "@/lib/schemas";

/**
 * The moment the seed timestamps in data/seed-reports.json were written relative to.
 * On load every timestamp is shifted so this instant becomes "now": a report written
 * as 4 hours before it always shows "4 h ago", and the fresh/stale mix stays the same
 * whichever day the demo runs. Update this if you rewrite the seed timestamps.
 */
export const SEED_AS_OF = "2026-09-26T12:00:00Z";

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Turns the seed file into app records: stable ids added, timestamps moved to the present. */
export function loadSeed(seed: SeedReports, now: number): { areas: AreaRecord[]; triageCases: TriageCaseRecord[] } {
  const offset = now - Date.parse(SEED_AS_OF);
  const shift = (timestamp: string) => new Date(Date.parse(timestamp) + offset).toISOString();

  return {
    areas: seed.areas.map((area) => ({
      ...area,
      reports: area.reports.map((report, i) => ({
        ...report,
        id: `${slug(area.name)}-${i + 1}`,
        timestamp: shift(report.timestamp),
      })),
    })),
    triageCases: seed.triage_cases_logged.map((c, i) => ({ ...c, id: `case-${i + 1}` })),
  };
}

/** The reverse: app records back in the spec's shape, e.g. to send to an API route. */
export function toSeedShape(areas: AreaRecord[], triageCases: TriageCaseRecord[]): SeedReports {
  return {
    areas: areas.map((area) => ({
      name: area.name,
      reports: area.reports.map(({ supply, status, reported_by, verified_by, timestamp }) => ({
        supply,
        status,
        reported_by,
        verified_by,
        timestamp,
      })),
    })),
    triage_cases_logged: triageCases.map(({ area, urgency_tier, supply_needed }) => ({
      area,
      urgency_tier,
      supply_needed,
    })),
  };
}
