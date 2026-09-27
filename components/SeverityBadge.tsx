"use client";

import { CircleCheck, Clock, OctagonAlert, PackagePlus, TriangleAlert, type LucideIcon } from "lucide-react";
import { BADGE_COLORS, CONDITION_TOKEN, type AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

const ICONS: Record<AreaCondition, LucideIcon> = {
  critical: OctagonAlert,
  low: TriangleAlert,
  stable: CircleCheck,
  surplus: PackagePlus,
  stale: Clock,
};

interface SeverityBadgeProps {
  status: AreaCondition;
  /** Grays the badge out (for a stale report) but keeps its own icon and label. */
  muted?: boolean;
}

/** A report's or area's stock level: the hue's tint, its icon and its name, never colour alone. */
export function SeverityBadge({ status, muted = false }: SeverityBadgeProps) {
  const { t } = useT();
  const Icon = ICONS[status];
  const token = muted ? "stale" : CONDITION_TOKEN[status];
  // Critical carries more weight than the rest: a full rust outline and bold text.
  const critical = token === "critical";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-caption ${BADGE_COLORS[token]} ${
        critical ? "border border-critical font-bold" : "font-semibold"
      }`}
    >
      <Icon aria-hidden />
      {t(`status.${status}`)}
    </span>
  );
}
