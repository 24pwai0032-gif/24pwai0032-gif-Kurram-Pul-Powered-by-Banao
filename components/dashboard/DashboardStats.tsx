"use client";

import type { DashboardStats as Stats } from "@/lib/dashboard";
import { useT } from "@/lib/useT";

interface StatTileProps {
  /** The critical tile leads: critical elevation, spanning its row, with the largest figure. */
  critical?: boolean;
  className?: string;
  label: string;
  value: string | number;
}

function StatTile({ label, value, critical = false, className = "" }: StatTileProps) {
  return (
    <div className={`${critical ? "card-critical" : "card-routine"} ${className}`}>
      <dt className={`text-caption ${critical ? "font-semibold text-critical-text" : "text-text-secondary"}`}>
        {label}
      </dt>
      <dd className={`mt-1 font-display font-semibold tabular-nums ${critical ? "text-display text-critical-text" : "text-heading text-text-primary"}`}>
        {value}
      </dd>
    </div>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const { t } = useT();
  return (
    <dl aria-label={t("dashboard.stats.label")} className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:grid-cols-2">
      <StatTile
        critical
        className="col-span-2"
        label={t("dashboard.stats.critical")}
        value={stats.critical}
      />
      <StatTile label={t("dashboard.stats.surplus")} value={stats.surplus} />
      <StatTile label={t("dashboard.stats.stale")} value={stats.stale} />
      <StatTile
        className="col-span-2 md:col-span-1 lg:col-span-2"
        label={t("dashboard.stats.verified")}
        value={t("dashboard.stats.verifiedValue", { verified: stats.verified, total: stats.total })}
      />
    </dl>
  );
}
