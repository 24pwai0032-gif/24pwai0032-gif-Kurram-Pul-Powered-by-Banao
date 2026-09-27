"use client";

import { CircleCheck, Clock, OctagonAlert, PackagePlus, TriangleAlert, type LucideIcon } from "lucide-react";
import type { AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

const STYLES: Record<AreaCondition, { icon: LucideIcon; className: string }> = {
  critical: { icon: OctagonAlert, className: "bg-critical text-surface" },
  low: { icon: TriangleAlert, className: "bg-low-bg text-low-ink" },
  stable: { icon: CircleCheck, className: "bg-stable-bg text-stable-ink" },
  surplus: { icon: PackagePlus, className: "bg-surplus-bg text-surplus-ink" },
  stale: { icon: Clock, className: "bg-stale-bg text-stale-ink" },
};

interface SeverityBadgeProps {
  status: AreaCondition;
  /** Grays the badge out (for a stale report) but keeps its own icon and label. */
  muted?: boolean;
}

export function SeverityBadge({ status, muted = false }: SeverityBadgeProps) {
  const { t } = useT();
  const Icon = STYLES[status].icon;
  const colors = STYLES[muted ? "stale" : status].className;
  // The most urgent state gets the most visual weight, not just a different color.
  const emphasis = status === "critical" && !muted;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full ${colors} ${
        emphasis ? "px-2.5 py-1 text-[13px] font-bold" : "px-2 py-0.5 text-xs font-semibold"
      }`}
    >
      <Icon aria-hidden className={emphasis ? "size-4" : "size-3.5"} strokeWidth={2.25} />
      {t(`status.${status}`)}
    </span>
  );
}
