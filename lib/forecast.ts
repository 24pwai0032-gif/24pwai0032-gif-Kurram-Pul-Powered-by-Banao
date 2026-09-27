import type { ClosureEvent } from "@/lib/schemas";

export const RISK_LEVELS = ["low", "elevated", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/**
 * The risk_level the forecaster prompt asks for, read out of its free-text answer:
 * "risk_level: elevated", "**Risk level:** Elevated", "Elevated risk"... Null if absent.
 */
export function parseRiskLevel(text: string): RiskLevel | null {
  const match =
    // "risk_level: elevated", "**Risk level:** Elevated", "risk level is elevated"
    text.match(/risk[\s_-]*level\W{0,20}(?:[a-z]+\W+){0,3}?(low|elevated|high)\b/i) ??
    // "Elevated risk", "high-risk"
    text.match(/\b(low|elevated|high)\b[^a-z.\n]{0,4}risk\b/i);
  return match ? (match[1].toLowerCase() as RiskLevel) : null;
}

/** The reasoning without its "risk_level: …" line, which the badge above already shows. */
export function withoutRiskLevelLine(text: string): string {
  return text.replace(/^[#>*_\s-]*risk[\s_-]*level\W{0,12}(low|elevated|high)\b.*$/im, "").trim();
}

export interface ClosureStats {
  count: number;
  medianDays: number;
  longestDays: number;
}

export function closureStats(closures: ClosureEvent[]): ClosureStats {
  const days = closures.map((c) => c.duration_days).sort((a, b) => a - b);
  const mid = Math.floor(days.length / 2);
  const medianDays = days.length === 0 ? 0 : days.length % 2 ? days[mid] : (days[mid - 1] + days[mid]) / 2;
  return { count: days.length, medianDays, longestDays: days.at(-1) ?? 0 };
}
