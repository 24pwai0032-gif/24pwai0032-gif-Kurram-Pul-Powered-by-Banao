"use client";

import { useMemo } from "react";
import { AreaCard } from "@/components/dashboard/AreaCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { KurramMap } from "@/components/dashboard/KurramMap";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { computeStats, summarizeAreas } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

export function ShortageDashboard() {
  const { t } = useT();
  const areas = useAppStore((s) => s.areas);
  const triageCases = useAppStore((s) => s.triageCases);
  const now = useAppStore((s) => s.now);

  const summaries = useMemo(() => summarizeAreas(areas, triageCases, now), [areas, triageCases, now]);
  const stats = useMemo(() => computeStats(summaries), [summaries]);

  return (
    <section aria-labelledby="dashboard-title" className="space-y-4">
      <header className="space-y-2">
        <h1 id="dashboard-title" className="text-xl font-semibold text-ink">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-ink-2">{t("dashboard.subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <div className="space-y-4">
          <SummaryPanel />
          <DashboardStats stats={stats} />
          <KurramMap summaries={summaries} />
        </div>
        {/* Columns rather than a grid, so cards of different heights pack without row gaps. */}
        <div className="gap-3 xl:columns-2">
          {summaries.map((summary) => (
            <div key={summary.area.name} className="break-inside-avoid pb-3">
              <AreaCard summary={summary} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
