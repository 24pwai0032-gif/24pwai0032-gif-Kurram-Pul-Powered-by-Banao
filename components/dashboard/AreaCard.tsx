"use client";

import { EyeOff } from "lucide-react";
import { ReportRow } from "@/components/dashboard/ReportRow";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { URGENCY_TIERS } from "@/lib/schemas";
import { conditionColor } from "@/lib/severity";
import { ageMs, HOUR_MS } from "@/lib/staleness";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

export function AreaCard({ summary }: { summary: AreaSummary }) {
  const { t, tArea, tSupply, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const { area, condition, reports, triageCount, triageByTier, newCases, lastUpdated, isBlindSpot } = summary;
  const anchorId = areaAnchorId(area.name);
  const critical = condition === "critical";

  return (
    <article
      id={anchorId}
      aria-labelledby={`${anchorId}-title`}
      className={`scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm ${
        critical ? "border-s-[7px]" : "border-s-4"
      }`}
      style={{ borderInlineStartColor: conditionColor(condition) }}
    >
      <header
        className={`flex items-start justify-between gap-3 ${critical ? "-mx-4 -mt-4 bg-critical-bg px-4 pt-3.5 pb-3" : ""}`}
      >
        <div className="min-w-0">
          <h3 id={`${anchorId}-title`} className={critical ? "text-lg font-bold text-ink" : "font-semibold text-ink"}>
            {tArea(area.name)}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("dashboard.area.triageCases", { count: triageCount })}
            {lastUpdated && (
              <> · {t("dashboard.area.updated", { age: formatAge(ageMs(lastUpdated, now)) })}</>
            )}
          </p>
        </div>
        <SeverityBadge status={condition} />
      </header>

      {triageCount > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {URGENCY_TIERS.filter((tier) => triageByTier[tier] > 0).map((tier) => (
            <UrgencyBadge key={tier} tier={tier} count={triageByTier[tier]} />
          ))}
        </div>
      )}

      {newCases.length > 0 && (
        <ul className="mt-2 space-y-1">
          {newCases.slice(0, 3).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
              <span className="rounded-full bg-ink px-1.5 py-px text-[10px] font-bold tracking-wide text-surface uppercase">
                {t("dashboard.area.newCase")}
              </span>
              <UrgencyBadge tier={c.urgency_tier} />
              {c.supply_needed && <span className="font-medium text-ink">{tSupply(c.supply_needed)}</span>}
              {c.loggedAt && <span className="text-muted">· {formatAge(ageMs(c.loggedAt, now))}</span>}
            </li>
          ))}
        </ul>
      )}

      {isBlindSpot && lastUpdated && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-stale bg-stale-bg px-3 py-2 text-sm font-medium text-stale-ink">
          <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("dashboard.area.blindSpot", { hours: Math.floor(ageMs(lastUpdated, now) / HOUR_MS) })}
        </p>
      )}

      {reports.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("dashboard.area.noReports")}</p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {reports.map((view) => (
            <ReportRow key={view.report.id} {...view} />
          ))}
        </ul>
      )}
    </article>
  );
}
