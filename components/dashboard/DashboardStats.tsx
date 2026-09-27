"use client";

import { Clock, OctagonAlert, PackagePlus, ShieldCheck, type LucideIcon } from "lucide-react";
import type { DashboardStats as Stats } from "@/lib/dashboard";
import { useT } from "@/lib/useT";

interface StatTileProps {
  icon: LucideIcon;
  /** The critical tile leads: critical elevation, spanning its row, with the largest figure. */
  critical?: boolean;
  className?: string;
  /** Colour class for the icon only; the figure and label stay in text colours. */
  iconClass: string;
  label: string;
  value: string | number;
}

function StatTile({ icon: Icon, iconClass, label, value, critical = false, className = "" }: StatTileProps) {
  return (
    <div className={`${critical ? "card-critical" : "card-routine"} ${className}`}>
      <dt className={`flex items-center gap-2 text-caption ${critical ? "font-semibold text-critical-text" : "text-text-secondary"}`}>
        <Icon aria-hidden className={iconClass} />
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
        icon={OctagonAlert}
        iconClass="text-critical-text"
        label={t("dashboard.stats.critical")}
        value={stats.critical}
      />
      <StatTile icon={PackagePlus} iconClass="text-surplus-text" label={t("dashboard.stats.surplus")} value={stats.surplus} />
      <StatTile icon={Clock} iconClass="text-stale-text" label={t("dashboard.stats.stale")} value={stats.stale} />
      <StatTile
        className="col-span-2 md:col-span-1 lg:col-span-2"
        icon={ShieldCheck}
        iconClass="text-text-secondary"
        label={t("dashboard.stats.verified")}
        value={t("dashboard.stats.verifiedValue", { verified: stats.verified, total: stats.total })}
      />
    </dl>
  );
}
