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
  /** A coloured dot and a word instead of a chip, for tallies and lists that sit beside a card's main chip. */
  quiet?: boolean;
}

const QUIET_DOT = { critical: "bg-critical", warning: "bg-warning", stable: "bg-stable" } as const;
const QUIET_WORD = { critical: "text-critical-text", warning: "text-warning-text", stable: "text-stable-text" } as const;

export function UrgencyBadge({ tier, size = "sm", count, pulse = false, quiet = false }: UrgencyBadgeProps) {
  const { t } = useT();
  const Icon = ICONS[tier];
  const label = size === "lg" ? t(`triage.tiers.${tier}`) : t(`triage.tiersShort.${tier}`);
  const critical = tier === "critical";
  const token = TIER_TOKEN[tier] as keyof typeof QUIET_DOT;

  if (quiet) {
    return (
      <span className={`inline-flex shrink-0 items-center gap-2 text-caption font-semibold ${QUIET_WORD[token]}`}>
        <span aria-hidden className={`size-2 rounded-full ${QUIET_DOT[token]}`} />
        <span>
          {count !== undefined && <span className="tabular-nums">{count} </span>}
          {label}
        </span>
      </span>
    );
  }

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
