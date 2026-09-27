import { URGENCY_TIERS, type AreaRecord, type ReportRecord, type TriageCaseRecord, type UrgencyTier } from "@/lib/schemas";
import { CONDITION_PRIORITY, STATUS_RANK, type AreaCondition } from "@/lib/severity";
import { isStale } from "@/lib/staleness";

export interface ReportView {
  report: ReportRecord;
  stale: boolean;
}

export interface AreaSummary {
  area: AreaRecord;
  condition: AreaCondition;
  /** Fresh reports first (most severe first), stale ones last. */
  reports: ReportView[];
  criticalCount: number;
  triageCount: number;
  triageByTier: Record<UrgencyTier, number>;
  /** Cases logged from the triage assistant this session, newest first. */
  newCases: TriageCaseRecord[];
  /** Timestamp of the newest report, or null when the area has none. */
  lastUpdated: string | null;
  /** The area has reported before, but every report is now stale. */
  isBlindSpot: boolean;
}

export interface DashboardStats {
  critical: number;
  surplus: number;
  stale: number;
  verified: number;
  total: number;
}

export function areaAnchorId(areaName: string): string {
  return `area-${areaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function summarizeArea(area: AreaRecord, triageCases: TriageCaseRecord[], now: number): AreaSummary {
  const reports = area.reports
    .map((report) => ({ report, stale: isStale(report.timestamp, now) }))
    .sort(
      (a, b) =>
        Number(a.stale) - Number(b.stale) ||
        STATUS_RANK[a.report.status] - STATUS_RANK[b.report.status] ||
        Date.parse(b.report.timestamp) - Date.parse(a.report.timestamp),
    );
  const fresh = reports.filter((r) => !r.stale);
  const cases = triageCases.filter((c) => c.area === area.name);
  const triageByTier = Object.fromEntries(
    URGENCY_TIERS.map((tier) => [tier, cases.filter((c) => c.urgency_tier === tier).length]),
  ) as Record<UrgencyTier, number>;
  const lastUpdated = area.reports.reduce<string | null>(
    (latest, r) => (latest === null || Date.parse(r.timestamp) > Date.parse(latest) ? r.timestamp : latest),
    null,
  );

  return {
    area,
    condition: fresh.length > 0 ? fresh[0].report.status : "stale",
    reports,
    criticalCount: fresh.filter((r) => r.report.status === "critical").length,
    triageCount: cases.length,
    triageByTier,
    newCases: cases.filter((c) => c.loggedAt !== undefined).reverse(),
    lastUpdated,
    isBlindSpot: reports.length > 0 && fresh.length === 0,
  };
}

/** Areas ordered by how urgently a responder should look at them. */
export function summarizeAreas(areas: AreaRecord[], triageCases: TriageCaseRecord[], now: number): AreaSummary[] {
  return areas
    .map((area) => summarizeArea(area, triageCases, now))
    .sort(
      (a, b) =>
        CONDITION_PRIORITY[a.condition] - CONDITION_PRIORITY[b.condition] ||
        b.criticalCount - a.criticalCount ||
        a.area.name.localeCompare(b.area.name),
    );
}

export function computeStats(summaries: AreaSummary[]): DashboardStats {
  const all = summaries.flatMap((s) => s.reports);
  return {
    critical: all.filter((r) => !r.stale && r.report.status === "critical").length,
    surplus: all.filter((r) => !r.stale && r.report.status === "surplus").length,
    stale: all.filter((r) => r.stale).length,
    verified: all.filter((r) => r.report.verified_by !== null).length,
    total: all.length,
  };
}
