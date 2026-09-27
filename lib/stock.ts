import { hopsFrom } from "@/lib/areas";
import { supplyFromLocalName } from "@/lib/i18n";
import type { AreaRecord, ReportRecord } from "@/lib/schemas";
import { isStale } from "@/lib/staleness";

export interface StockLead {
  area: string;
  report: ReportRecord;
  /** Hops along AREA_LINKS from the patient's area (0 = same area). */
  distance: number;
  stale: boolean;
}

const STOP_WORDS = new Set([
  "and", "for", "the", "with", "any", "some", "more", "his", "her", "their", "patient", "exact", "usual",
  "prescribed", "supply", "supplies", "medicine", "medication", "dose", "doses", "tablet", "syrup",
]);

/**
 * Other names the model uses for the supplies in the reports, each mapped to a keyword of
 * the reported name ("Oral rehydration solution" → "ors"). Found in real model output.
 */
const SYNONYMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\boral rehydration\b|\brehydration (salts?|solution)\b/, "ors"],
  [/\b(intravenous|saline|drips?|ringer'?s|dextrose)\b/, "fluid"],
  [/\b(acetaminophen|panadol|calpol)\b/, "paracetamol"],
  [/\b(salbutamol|albuterol|ventolin|nebuli[sz]er)\b/, "inhaler"],
  [/\b(amoxicillin|azithromycin|ceftriaxone|ciprofloxacin|augmentin|metronidazole)\b/, "antibiotic"],
  [/\b(sutures?|gauze|bandages?|dressings?)\b/, "surgical"],
  [/\b(infant|baby) (milk|formula)\b|\bformula milk\b/, "formula"],
];

/**
 * "Asthma inhalers" → ["asthma", "inhaler"], so "salbutamol inhaler" still matches.
 * Plurals are only trimmed on longer words, so acronyms like "ORS" survive intact.
 */
function keywords(supply: string): string[] {
  // A supply named in Urdu or Pashto ("انسولین") is matched by its English name.
  const text = (/[A-Za-z]/.test(supply) ? supply : (supplyFromLocalName(supply) ?? supply)).toLowerCase();
  const words = text
    .split(/[^a-z0-9]+/)
    .map((word) => (word.length > 4 ? word.replace(/s$/, "") : word))
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  for (const [pattern, keyword] of SYNONYMS) {
    if (pattern.test(text)) words.push(keyword);
  }
  return words;
}

export function sameSupply(a: string, b: string): boolean {
  const wanted = keywords(a);
  return keywords(b).some((word) => wanted.includes(word));
}

/**
 * The reports' own name for a supply the model described in its own words
 * ("His exact prescribed insulin" → "Insulin"), or the original when nothing matches.
 * Keeps logged cases grouping and translating like every other mention of the supply.
 */
export function canonicalSupply(name: string, areas: AreaRecord[]): string {
  for (const area of areas) {
    for (const report of area.reports) {
      if (sameSupply(name, report.supply)) return report.supply;
    }
  }
  return name;
}

/**
 * Where a supply the patient needs has been reported as surplus or stable, nearest first
 * (SPEC section 6: "suggest the nearest reporting pharmacy with stock"). Ties prefer
 * surplus over stable, verified over unverified, and fresh over stale reports.
 */
export function findNearbyStock(
  supply: string,
  fromArea: string,
  areas: AreaRecord[],
  now: number,
  limit = 2,
): StockLead[] {
  const distances = hopsFrom(fromArea);
  const leads: StockLead[] = areas.flatMap((area) =>
    area.reports
      .filter((report) => (report.status === "surplus" || report.status === "stable") && sameSupply(supply, report.supply))
      .map((report) => ({
        area: area.name,
        report,
        distance: distances.get(area.name) ?? Number.POSITIVE_INFINITY,
        stale: isStale(report.timestamp, now),
      })),
  );

  return leads
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        Number(a.report.status !== "surplus") - Number(b.report.status !== "surplus") ||
        Number(a.report.verified_by === null) - Number(b.report.verified_by === null) ||
        Number(a.stale) - Number(b.stale),
    )
    .slice(0, limit);
}
