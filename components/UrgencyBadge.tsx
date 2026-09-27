"use client";

import { CircleCheck, Pill, Siren, type LucideIcon } from "lucide-react";
import type { UrgencyTier } from "@/lib/schemas";
import { useT } from "@/lib/useT";

// Red / orange / green per SPEC section 6, each with its own icon so color isn't the only cue.
const STYLES: Record<UrgencyTier, { icon: LucideIcon; className: string }> = {
  critical: { icon: Siren, className: "bg-critical text-surface" },
  needs_supplies: { icon: Pill, className: "bg-low-bg text-low-ink" },
  routine: { icon: CircleCheck, className: "bg-stable-bg text-stable-ink" },
};

interface UrgencyBadgeProps {
  tier: UrgencyTier;
  /** "lg" shows the full tier name ("Critical: evacuate"); "sm" the short one. */
  size?: "sm" | "lg";
  /** Prefixes a count, for per-area tallies on the dashboard. */
  count?: number;
}

export function UrgencyBadge({ tier, size = "sm", count }: UrgencyBadgeProps) {
  const { t } = useT();
  const { icon: Icon, className } = STYLES[tier];
  const label = size === "lg" ? t(`triage.tiers.${tier}`) : t(`triage.tiersShort.${tier}`);
  const critical = tier === "critical";
  const sizing =
    size === "lg"
      ? critical
        ? "px-3.5 py-1.5 text-base font-bold"
        : "px-3 py-1 text-sm font-semibold"
      : critical
        ? "px-2.5 py-1 text-[13px] font-bold"
        : "px-2 py-0.5 text-xs font-semibold";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full ${className} ${sizing}`}
    >
      <Icon aria-hidden className={size === "lg" || critical ? "size-4" : "size-3.5"} strokeWidth={2.25} />
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      {label}
    </span>
  );
}
