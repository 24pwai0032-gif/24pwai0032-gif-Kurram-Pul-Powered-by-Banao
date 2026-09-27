import { hopsFrom } from "@/lib/areas";
import type { AreaRecord, ReportRecord, TriageCaseRecord } from "@/lib/schemas";
import { isStale } from "@/lib/staleness";
import { canonicalSupply, sameSupply } from "@/lib/stock";

/**
 * Rule-based surplus matching, following SPEC section 8's "Matching Logic": reports marked
 * surplus or stable are paired with critical or needs_supplies gaps for the same supply in
 * other areas, ranked by urgency and proximity (named-area adjacency, no GPS).
 * It needs no AI and no connection, so the matcher still works when the LLM can't be reached;
 * the AI review (/api/surplus-match) adds judgment on top.
 */

export type NeedUrgency = "critical" | "needs_supplies";

export interface Need {
  area: string;
  supply: string;
  urgency: NeedUrgency;
  /** The shortage report behind this need, or null when it comes from triage cases alone. */
  report: ReportRecord | null;
  /** Triage cases in this area waiting on this supply. */
  triageCases: number;
}

export interface Offer {
  area: string;
  report: ReportRecord;
  /** Hops from the area in need (1 = next door). */
  distance: number;
}

export interface SurplusMatch {
  /** Stable across re-renders: the need and the best source. */
  id: string;
  need: Need;
  /** Best source first, then alternatives. */
  offers: Offer[];
}

export interface UnmatchedSupply {
  supply: string;
  needs: Need[];
}

export interface MatchResult {
  matches: SurplusMatch[];
  /** Supplies someone needs that no other area has reported spare: these need outside supply. */
  unmatched: UnmatchedSupply[];
}

const URGENCY_RANK: Record<NeedUrgency, number> = { critical: 0, needs_supplies: 1 };

function collectNeeds(areas: AreaRecord[], triageCases: TriageCaseRecord[]): Need[] {
  const needs: Need[] = [];
  for (const area of areas) {
    for (const report of area.reports) {
      if (report.status === "critical" || report.status === "low") {
        const urgency = report.status === "critical" ? "critical" : "needs_supplies";
        needs.push({ area: area.name, supply: report.supply, urgency, report, triageCases: 0 });
      }
    }
  }
  // Triage cases that need a supply join the matching report's need, or become a need of their own.
  for (const triageCase of triageCases) {
    const supply = triageCase.supply_needed;
    if (supply === null || triageCase.urgency_tier === "routine") continue;
    const urgency: NeedUrgency = triageCase.urgency_tier === "critical" ? "critical" : "needs_supplies";
    const existing = needs.find((n) => n.area === triageCase.area && sameSupply(n.supply, supply));
    if (existing) {
      existing.triageCases++;
      if (urgency === "critical") existing.urgency = "critical";
    } else {
      // Use the reports' name for the supply when one matches ("oral rehydration salts" → "ORS"),
      // so it groups and translates like every other mention of it.
      needs.push({ area: triageCase.area, supply: canonicalSupply(supply, areas), urgency, report: null, triageCases: 1 });
    }
  }
  return needs;
}

function isOffer(report: ReportRecord): boolean {
  return report.status === "surplus" || report.status === "stable";
}

export function findMatches(areas: AreaRecord[], triageCases: TriageCaseRecord[], now: number): MatchResult {
  const matches: SurplusMatch[] = [];
  const unmatched: UnmatchedSupply[] = [];

  for (const need of collectNeeds(areas, triageCases)) {
    // Covered locally: the area already reports spare stock of it, so it isn't a cross-area match.
    const local = areas.find((a) => a.name === need.area)?.reports.some((r) => isOffer(r) && sameSupply(need.supply, r.supply));
    if (local) continue;

    const hops = hopsFrom(need.area);
    const offers: Offer[] = areas
      .filter((area) => area.name !== need.area)
      .flatMap((area) =>
        area.reports
          .filter((report) => isOffer(report) && sameSupply(need.supply, report.supply))
          .map((report) => ({ area: area.name, report, distance: hops.get(area.name) ?? Number.POSITIVE_INFINITY })),
      )
      .sort(
        (a, b) =>
          a.distance - b.distance ||
          Number(a.report.status !== "surplus") - Number(b.report.status !== "surplus") ||
          Number(a.report.verified_by === null) - Number(b.report.verified_by === null) ||
          Number(isStale(a.report.timestamp, now)) - Number(isStale(b.report.timestamp, now)),
      );

    if (offers.length > 0) {
      matches.push({ id: `${need.area}::${need.supply}::${offers[0].report.id}`, need, offers });
    } else {
      const group = unmatched.find((g) => sameSupply(g.supply, need.supply));
      if (group) group.needs.push(need);
      else unmatched.push({ supply: need.supply, needs: [need] });
    }
  }

  // Critical needs first, then the nearest source, then the most triage cases waiting.
  matches.sort(
    (a, b) =>
      URGENCY_RANK[a.need.urgency] - URGENCY_RANK[b.need.urgency] ||
      a.offers[0].distance - b.offers[0].distance ||
      b.need.triageCases - a.need.triageCases ||
      a.need.area.localeCompare(b.need.area),
  );
  const worst = (g: UnmatchedSupply) => Math.min(...g.needs.map((n) => URGENCY_RANK[n.urgency]));
  unmatched.sort((a, b) => worst(a) - worst(b) || b.needs.length - a.needs.length);

  return { matches, unmatched };
}
