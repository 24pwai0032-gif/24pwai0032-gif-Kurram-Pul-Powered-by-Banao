"use client";

import type { CSSProperties } from "react";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { useGoTo } from "@/lib/navigation";
import type { AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

const ORDER: AreaCondition[] = ["critical", "low", "stable", "surplus", "stale"];

const BAR: Record<AreaCondition, string> = {
  critical: "bg-critical",
  low: "bg-warning",
  stable: "bg-stable",
  surplus: "bg-surplus",
  // Silent reports: hatched grey, so they read as "unknown" rather than as a fifth level.
  stale: "bg-stale-tint border border-dashed border-stale-text",
};

/**
 * Each area's supplies by stock level, as one stacked bar per area on a shared scale: the red
 * share shows at a glance where to look first. Counts come straight from the reports; a bar opens
 * its area's card.
 */
export function StockChart({ summaries, className = "", style }: { summaries: AreaSummary[]; className?: string; style?: CSSProperties }) {
  const { t, tArea } = useT();
  const goTo = useGoTo();
  const rows = summaries.map((s) => {
    const counts = Object.fromEntries(ORDER.map((c) => [c, 0])) as Record<AreaCondition, number>;
    for (const { report, stale } of s.reports) counts[stale ? "stale" : report.status] += 1;
    return { name: s.area.name, counts, total: s.reports.length };
  });
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <figure aria-labelledby="stock-chart-title" className={`card-routine ${className}`} style={style}>
      <figcaption>
        <h2 id="stock-chart-title" className="text-lead text-text-primary">
          {t("dashboard.chart.title")}
        </h2>
        <p className="mt-1 text-caption text-text-secondary">{t("dashboard.chart.caption")}</p>
      </figcaption>

      <ul className="mt-4 space-y-1">
        {rows.map(({ name, counts, total }) => {
          const parts = ORDER.filter((c) => counts[c] > 0);
          const summary = parts.map((c) => `${counts[c]} ${t(`status.${c}`)}`).join(", ");
          return (
            <li key={name}>
              <button
                type="button"
                data-chart-area={name}
                onClick={() => goTo("dashboard", areaAnchorId(name))}
                aria-label={`${tArea(name)}: ${summary}`}
                className="group grid w-full grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 rounded-md py-1 text-start"
              >
                <span className="text-body font-semibold text-text-primary group-hover:underline">{tArea(name)}</span>
                <span className="flex h-4 gap-1" style={{ width: `${(total / max) * 100}%` }}>
                  {parts.map((c) => (
                    <span
                      key={c}
                      title={`${counts[c]} ${t(`status.${c}`)}`}
                      className={`h-full rounded-sm ${BAR[c]}`}
                      style={{ flexGrow: counts[c], flexBasis: 0 }}
                    />
                  ))}
                </span>
                <span className="text-caption text-text-secondary tabular-nums">{total}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul aria-hidden className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-caption text-text-secondary">
        {ORDER.map((c) => (
          <li key={c} className="inline-flex items-center gap-2">
            <span className={`inline-block size-3 rounded-sm ${BAR[c]}`} />
            {t(`status.${c}`)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
