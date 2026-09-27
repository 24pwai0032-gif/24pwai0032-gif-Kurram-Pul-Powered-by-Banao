"use client";

import { EyeOff } from "lucide-react";
import { ReportRow } from "@/components/dashboard/ReportRow";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { URGENCY_TIERS } from "@/lib/schemas";
import { useFirstSight } from "@/lib/motion";
import { CARD_ELEVATION, CONDITION_TOKEN } from "@/lib/severity";
import { ageMs, HOUR_MS } from "@/lib/staleness";
import { useAppStore } from "@/lib/store";
import type { TriageCaseRecord } from "@/lib/schemas";
import { useT } from "@/lib/useT";

/** A case logged from triage this session. A critical one pulses once, the first time the dashboard shows it. */
function NewCaseRow({ triageCase: c }: { triageCase: TriageCaseRecord }) {
  const { t, tSupply, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const fresh = useFirstSight(c.urgency_tier === "critical" ? `dashboard:${c.id}` : null);
  return (
    <li className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
      <span className="text-caption font-bold tracking-wide text-brand-text uppercase">
        {t("dashboard.area.newCase")}
      </span>
      <UrgencyBadge tier={c.urgency_tier} pulse={fresh} />
      {c.supply_needed && <span className="font-medium text-text-primary">{tSupply(c.supply_needed)}</span>}
      {c.loggedAt && <span className="text-text-secondary">· {formatAge(ageMs(c.loggedAt, now))}</span>}
    </li>
  );
}

export function AreaCard({ summary }: { summary: AreaSummary }) {
  const { t, tArea, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const { area, condition, reports, triageCount, triageByTier, newCases, lastUpdated, isBlindSpot } = summary;
  const anchorId = areaAnchorId(area.name);
  const critical = condition === "critical";

  return (
    <article
      id={anchorId}
      aria-labelledby={`${anchorId}-title`}
      // Elevation by severity: critical areas physically stand out (border, shadow, padding).
      className={`scroll-mt-20 ${CARD_ELEVATION[CONDITION_TOKEN[condition]]}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${anchorId}-title`} className={`text-text-primary ${critical ? "text-title" : "text-lead"}`}>
            {tArea(area.name)}
          </h3>
          <p className="mt-1 text-caption text-text-secondary">
            {t("dashboard.area.triageCases", { count: triageCount })}
            {lastUpdated && (
              <> · {t("dashboard.area.updated", { age: formatAge(ageMs(lastUpdated, now)) })}</>
            )}
          </p>
        </div>
        <SeverityBadge status={condition} />
      </header>

      {triageCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {URGENCY_TIERS.filter((tier) => triageByTier[tier] > 0).map((tier) => (
            <UrgencyBadge key={tier} tier={tier} count={triageByTier[tier]} quiet />
          ))}
        </div>
      )}

      {newCases.length > 0 && (
        <ul className="mt-2 space-y-1">
          {newCases.slice(0, 3).map((c) => (
            <NewCaseRow key={c.id} triageCase={c} />
          ))}
        </ul>
      )}

      {isBlindSpot && lastUpdated && (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-stale bg-stale-tint px-3 py-2 text-body font-medium text-stale-text">
          <EyeOff aria-hidden />
          {t("dashboard.area.blindSpot", { hours: Math.floor(ageMs(lastUpdated, now) / HOUR_MS) })}
        </p>
      )}

      {reports.length === 0 ? (
        <p className="mt-3 text-body text-text-secondary">{t("dashboard.area.noReports")}</p>
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {reports.map((view) => (
            <ReportRow key={view.report.id} {...view} />
          ))}
        </ul>
      )}
    </article>
  );
}
