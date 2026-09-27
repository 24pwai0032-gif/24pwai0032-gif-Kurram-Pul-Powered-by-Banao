"use client";

import { Ambulance, ArrowUpRight, MapPin } from "lucide-react";
import { useMemo } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { VerificationTag } from "@/components/VerificationTag";
import { areaAnchorId } from "@/lib/dashboard";
import { matchAnchorId, unmatchedAnchorId, useGoTo } from "@/lib/navigation";
import { textLang } from "@/lib/i18n";
import { TIER_COLOR } from "@/lib/severity";
import { ageMs } from "@/lib/staleness";
import { canonicalSupply, findNearbyStock } from "@/lib/stock";
import { useAppStore, type TriageMessage } from "@/lib/store";
import { useT } from "@/lib/useT";

type ClassificationMessage = Extract<TriageMessage, { kind: "classification" }>;

function NearestStock({ supply, area }: { supply: string; area: string }) {
  const { t, tArea, tSupply, tName } = useT();
  const areas = useAppStore((s) => s.areas);
  const now = useAppStore((s) => s.now);
  const leads = useMemo(() => findNearbyStock(supply, area, areas, now), [supply, area, areas, now]);

  return (
    <div className="mt-3 rounded-lg bg-surface-2 p-2.5">
      <p className="text-xs font-semibold text-muted">{t("triage.nearestStock")}</p>
      {leads.length === 0 ? (
        <p className="mt-1 text-sm text-ink-2">{t("triage.noStock", { supply: tSupply(supply) })}</p>
      ) : (
        <ul className="mt-1.5 space-y-2">
          {leads.map((lead) => (
            <li key={lead.report.id} className="flex flex-wrap items-center gap-1.5 text-sm">
              <MapPin aria-hidden className="size-3.5 shrink-0 text-muted" />
              <span className="font-medium text-ink">
                {t("triage.stockLine", {
                  reporter: tName(lead.report.reported_by),
                  area: lead.distance === 0 ? t("triage.sameArea") : tArea(lead.area),
                })}
              </span>
              <SeverityBadge status={lead.report.status} muted={lead.stale} />
              <VerificationTag label={lead.report.verified_by} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The classifier's answer in chat mode: tier, why, next step, and where it was logged. */
export function ClassificationCard({ message }: { message: ClassificationMessage }) {
  const { t, tArea, tSupply, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const goTo = useGoTo();
  const areas = useAppStore((s) => s.areas);
  const { result, area } = message;
  const supply = result.supply_needed === null ? null : canonicalSupply(result.supply_needed, areas);
  const tier = result.urgency_tier;
  const critical = tier === "critical";

  return (
    <article
      className={`w-full overflow-hidden rounded-2xl border border-line bg-surface p-3.5 shadow-sm ${
        critical ? "border-s-[7px]" : "border-s-4"
      }`}
      style={{ borderInlineStartColor: TIER_COLOR[tier] }}
    >
      <header className={critical ? "-mx-3.5 -mt-3.5 bg-critical-bg px-3.5 pt-3.5 pb-3" : ""}>
        <UrgencyBadge tier={tier} size="lg" />
        {critical && (
          <p className="mt-2.5 flex items-start gap-2 text-[15px] font-bold text-critical-ink">
            <Ambulance aria-hidden className="mt-0.5 size-5 shrink-0" />
            <span>
              {t("triage.flagged")}
              <span className="block text-sm font-medium">{t("triage.edhiLine")}</span>
            </span>
          </p>
        )}
      </header>

      <dl className="mt-3 space-y-2.5 text-sm">
        {result.reason && (
          <div>
            <dt className="text-xs font-semibold text-muted">{t("triage.reason")}</dt>
            <dd dir="auto" lang={textLang(result.reason)} className="reading text-ink-2">
              {result.reason}
            </dd>
          </div>
        )}
        {result.recommended_action && (
          <div>
            <dt className="text-xs font-semibold text-muted">{t("triage.action")}</dt>
            <dd dir="auto" lang={textLang(result.recommended_action)} className="reading font-medium text-ink">
              {result.recommended_action}
            </dd>
          </div>
        )}
        {result.supply_needed && (
          <div>
            <dt className="text-xs font-semibold text-muted">{t("triage.supplyNeeded")}</dt>
            <dd dir="auto" className="text-ink">
              {tSupply(supply ?? result.supply_needed)}
              {/* Show the model's own wording too, unless it already contains the reports' name. */}
              {supply !== null &&
                !result.supply_needed.toLowerCase().includes(supply.toLowerCase()) &&
                !result.supply_needed.includes(tSupply(supply)) && (
                <span lang={textLang(result.supply_needed)} className="text-muted"> ({result.supply_needed})</span>
              )}
            </dd>
          </div>
        )}
        {result.follow_up_question && (
          <div>
            <dt className="text-xs font-semibold text-muted">{t("triage.followUp")}</dt>
            <dd dir="auto" lang={textLang(result.follow_up_question)} className="reading text-ink-2">
              {result.follow_up_question}
            </dd>
          </div>
        )}
      </dl>

      {result.supply_needed && <NearestStock supply={supply ?? result.supply_needed} area={area} />}

      {tier === "routine" && <p className="mt-3 text-xs text-muted">{t("triage.recheck")}</p>}

      <p className="mt-3 text-xs text-muted">
        {t("ai.generatedBy", { model: message.model, age: formatAge(ageMs(message.at, now)) })}
      </p>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-xs text-muted">
        <span>{t("triage.loggedTo", { area: tArea(area) })}</span>
        <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => goTo("dashboard", areaAnchorId(area))}
            className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
          >
            {t("triage.viewOnDashboard")}
            <ArrowUpRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
          </button>
          {supply && (
            <button
              type="button"
              onClick={() => goTo("matcher", matchAnchorId(area, supply), unmatchedAnchorId(supply))}
              className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
            >
              {t("triage.viewMatcher")}
              <ArrowUpRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
            </button>
          )}
        </span>
      </footer>
    </article>
  );
}
