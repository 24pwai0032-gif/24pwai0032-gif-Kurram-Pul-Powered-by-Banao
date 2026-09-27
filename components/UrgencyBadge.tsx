"use client";

import { CircleCheck, Pill, Siren, type LucideIcon } from "lucide-react";
import type { UrgencyTier } from "@/lib/schemas";
import { BADGE_COLORS, TIER_TOKEN } from "@/lib/severity";
import { useT } from "@/lib/useT";

// Rust / ochre / orchard green per SPEC section 6, each with its own icon so colour isn't the only cue.
const ICONS: Record<UrgencyTier, LucideIcon> = {
  critical: Siren,
  needs_supplies: Pill,
  routine: CircleCheck,
};

interface UrgencyBadgeProps {
  tier: UrgencyTier;
  /** "lg" shows the full tier name ("Critical: evacuate"); "sm" the short one. */
  size?: "sm" | "lg";
  /** Prefixes a count, for per-area tallies on the dashboard. */
  count?: number;
  /** Pulses once: this badge is news (a critical case logged moments ago). */
  pulse?: boolean;
}

export function UrgencyBadge({ tier, size = "sm", count, pulse = false }: UrgencyBadgeProps) {
  const { t } = useT();
  const Icon = ICONS[tier];
  const label = size === "lg" ? t(`triage.tiers.${tier}`) : t(`triage.tiersShort.${tier}`);
  const critical = tier === "critical";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full ${BADGE_COLORS[TIER_TOKEN[tier]]} ${
        size === "lg" ? "px-3 py-1 text-body" : "px-2 py-1 text-caption"
      } ${critical ? "border border-critical font-bold" : "font-semibold"} ${pulse ? "pulse-once" : ""}`}
    >
      <Icon aria-hidden />
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      {label}
    </span>
  );
}
