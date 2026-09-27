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

/** CSS color for marks (pins, dots, borders). Text uses the matching `-ink` token instead. */
export function conditionColor(condition: AreaCondition): string {
  return `var(--${condition})`;
}

/** Mark color per triage urgency tier: red / orange / green (SPEC section 6). */
export const TIER_COLOR: Record<UrgencyTier, string> = {
  critical: "var(--critical)",
  needs_supplies: "var(--low)",
  routine: "var(--stable)",
};
