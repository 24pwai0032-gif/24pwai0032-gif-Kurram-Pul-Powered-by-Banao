import type { SupplyStatus, UrgencyTier } from "@/lib/schemas";

/** An area's overall condition: its worst fresh report, or "stale" when it has gone silent. */
export type AreaCondition = SupplyStatus | "stale";

/** Lower rank = more severe. */
export const STATUS_RANK: Record<SupplyStatus, number> = {
  critical: 0,
  low: 1,
  stable: 2,
  surplus: 3,
};

/**
 * Sort order for areas. A silent area ranks right after critical ones:
 * during a closure, no news from an area is itself a warning sign.
 */
export const CONDITION_PRIORITY: Record<AreaCondition, number> = {
  critical: 0,
  stale: 1,
  low: 2,
  stable: 3,
  surplus: 4,
};

/** The design-token severity for each condition (design-tokens.css). Reports say "low"; the token is "warning". */
export type SeverityToken = "critical" | "warning" | "stable" | "surplus" | "stale";

export const CONDITION_TOKEN: Record<AreaCondition, SeverityToken> = {
  critical: "critical",
  low: "warning",
  stable: "stable",
  surplus: "surplus",
  stale: "stale",
};

/** CSS color for marks (pins, dots, bars). Text uses the matching `-text` token instead. */
export function conditionColor(condition: AreaCondition): string {
  return `var(--color-${CONDITION_TOKEN[condition]})`;
}

/**
 * Elevation per severity (the card-* utilities in design-tokens.css): a critical card has a
 * full rust border, a stronger shadow and more padding; a warning card an ochre border and a
 * faint shadow; everything else sits flat with a hairline border.
 */
export const CARD_ELEVATION: Record<SeverityToken, string> = {
  critical: "card-critical",
  warning: "card-warning",
  stable: "card-routine",
  surplus: "card-routine",
  stale: "card-routine",
};

/** Badge colours: the hue's 12% tint behind text in the hue's readable tone. */
export const BADGE_COLORS: Record<SeverityToken, string> = {
  critical: "bg-critical-tint text-critical-text",
  warning: "bg-warning-tint text-warning-text",
  stable: "bg-stable-tint text-stable-text",
  surplus: "bg-surplus-tint text-surplus-text",
  stale: "bg-stale-tint text-stale-text",
};

/** The token severity per triage urgency tier: rust / ochre / orchard green (SPEC section 6). */
export const TIER_TOKEN: Record<UrgencyTier, SeverityToken> = {
  critical: "critical",
  needs_supplies: "warning",
  routine: "stable",
};
