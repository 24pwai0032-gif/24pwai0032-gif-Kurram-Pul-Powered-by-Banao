"use client";

import { useMemo } from "react";
import { AreaCard } from "@/components/dashboard/AreaCard";
import { KurramMap } from "@/components/dashboard/KurramMap";
import { RoadStatus } from "@/components/dashboard/RoadStatus";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { computeStats, summarizeAreas } from "@/lib/dashboard";
import { riseOrder } from "@/lib/motion";
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
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <header className="space-y-2">
        <h1 id="dashboard-title" className="text-heading text-text-primary">
          {t("dashboard.title")}
        </h1>
        <p className="text-body text-text-secondary">{t("dashboard.subtitle")}</p>
      </header>

      {/* First, the situation in one line: the road is closed, and what that means right now. */}
      <RoadStatus summaries={summaries} stats={stats} className="rise" style={riseOrder(0)} />

      {/* Wide screens: the map beside the AI summary. Phones read the summary first. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="rise lg:col-start-2 lg:row-start-1" style={riseOrder(2)}>
          <SummaryPanel />
        </div>
        <KurramMap
          summaries={summaries}
          title={t("dashboard.map.title")}
          caption={t("dashboard.map.caption")}
          className="rise lg:col-start-1 lg:row-start-1"
          style={riseOrder(1)}
        />
      </div>

      {/* Columns rather than a grid, so cards of different heights pack without row gaps. */}
      <div className="gap-4 md:columns-2 xl:columns-3">
        {summaries.map((summary, i) => (
          <div key={summary.area.name} className="rise break-inside-avoid pb-4" style={riseOrder(i + 3)}>
            <AreaCard summary={summary} />
          </div>
        ))}
      </div>
    </section>
  );
}
