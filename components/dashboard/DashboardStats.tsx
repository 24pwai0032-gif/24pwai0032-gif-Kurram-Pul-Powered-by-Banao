"use client";

import { Clock, OctagonAlert, PackagePlus, ShieldCheck, type LucideIcon } from "lucide-react";
import type { DashboardStats as Stats } from "@/lib/dashboard";
import { useT } from "@/lib/useT";

interface StatTileProps {
  icon: LucideIcon;
  /** The critical tile leads: it spans the row, with a tinted ground and a larger number. */
  critical?: boolean;
  className?: string;
  /** Color for the icon only; the number and label stay in text colors. */
  iconColor: string;
  label: string;
  value: string | number;
}

function StatTile({ icon: Icon, iconColor, label, value, critical = false, className = "" }: StatTileProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${critical ? "border-critical/40 bg-critical-bg" : "border-line bg-surface"} ${className}`}
    >
      <dt className={`flex items-center gap-1.5 text-xs ${critical ? "font-semibold text-critical-ink" : "text-muted"}`}>
        <Icon aria-hidden className="size-4 shrink-0" style={{ color: iconColor }} strokeWidth={2.25} />
        {label}
      </dt>
      <dd className={`mt-1 font-semibold tabular-nums ${critical ? "text-4xl font-bold text-critical-ink" : "text-2xl text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const { t } = useT();
  return (
    <dl aria-label={t("dashboard.stats.label")} className="grid grid-cols-2 gap-2 md:grid-cols-5 lg:grid-cols-2">
      <StatTile
        critical
        className="col-span-2"
        icon={OctagonAlert}
        iconColor="var(--critical)"
        label={t("dashboard.stats.critical")}
        value={stats.critical}
      />
      <StatTile icon={PackagePlus} iconColor="var(--surplus)" label={t("dashboard.stats.surplus")} value={stats.surplus} />
      <StatTile icon={Clock} iconColor="var(--stale)" label={t("dashboard.stats.stale")} value={stats.stale} />
      <StatTile
        className="col-span-2 md:col-span-1 lg:col-span-2"
        icon={ShieldCheck}
        iconColor="var(--ink-2)"
        label={t("dashboard.stats.verified")}
        value={t("dashboard.stats.verifiedValue", { verified: stats.verified, total: stats.total })}
      />
    </dl>
  );
}
