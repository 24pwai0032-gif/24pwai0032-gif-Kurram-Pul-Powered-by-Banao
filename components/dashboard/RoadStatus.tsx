"use client";

import { useMemo } from "react";
import type { AreaSummary, DashboardStats } from "@/lib/dashboard";
import { findMatches } from "@/lib/matching";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** The "no entry" road sign: a red disc with a white bar. */
function NoEntrySign() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-12 shrink-0">
      <circle cx="24" cy="24" r="22" fill="var(--color-critical)" stroke="var(--color-on-severity)" strokeWidth="2" />
      <rect x="10" y="20" width="28" height="8" rx="1.5" fill="var(--color-on-severity)" />
    </svg>
  );
}

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <dd className="font-display text-heading font-bold tabular-nums text-on-sign">{value}</dd>
      <dt className="text-caption text-on-sign-muted">{label}</dt>
    </div>
  );
}

/**
 * The dashboard's first line, styled as a road sign: the road is closed, and here is what that
 * means right now: critical shortages, same-day fixes available next door, areas gone silent,
 * and how much of it is verified. Every figure is computed from the reports on this page.
 */
export function RoadStatus({ summaries, stats, className = "", style }: {
  summaries: AreaSummary[];
  stats: DashboardStats;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useT();
  const areas = useAppStore((s) => s.areas);
  const triageCases = useAppStore((s) => s.triageCases);
  const now = useAppStore((s) => s.now);
  const matches = useMemo(() => findMatches(areas, triageCases, now).matches.length, [areas, triageCases, now]);
  const silent = summaries.filter((s) => s.isBlindSpot).length;

  return (
    <section
      data-sign
      aria-labelledby="road-status-title"
      className={`flex flex-wrap items-center gap-x-12 gap-y-6 rounded-lg bg-sign p-6 text-on-sign ${className}`}
      style={style}
    >
      <div className="flex min-w-0 items-center gap-4">
        <NoEntrySign />
        <div className="min-w-0">
          <p className="text-caption font-semibold tracking-wide text-signal uppercase">{t("road.label")}</p>
          <h2 id="road-status-title" className="text-title font-bold text-on-sign">
            {t("road.closed")}
          </h2>
        </div>
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-4 lg:ms-auto">
        <Figure value={stats.critical} label={t("road.critical")} />
        <Figure value={matches} label={t("road.matches")} />
        <Figure value={silent} label={t("road.silent")} />
        <Figure value={t("road.verifiedValue", { verified: stats.verified, total: stats.total })} label={t("road.verified")} />
      </dl>
    </section>
  );
}
