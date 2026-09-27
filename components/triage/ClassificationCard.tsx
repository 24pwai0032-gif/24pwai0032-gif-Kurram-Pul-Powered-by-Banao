"use client";

import { Ambulance, ArrowUpRight, MapPin } from "lucide-react";
import { useMemo } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { VerificationTag } from "@/components/VerificationTag";
import { areaAnchorId } from "@/lib/dashboard";
import { matchAnchorId, unmatchedAnchorId, useGoTo } from "@/lib/navigation";
import { textLang } from "@/lib/i18n";
import { CARD_ELEVATION, TIER_TOKEN } from "@/lib/severity";
import { ageMs } from "@/lib/staleness";
import { canonicalSupply, findNearbyStock } from "@/lib/stock";
import { useAppStore, type TriageMessage } from "@/lib/store";
import { useT } from "@/lib/useT";

type ClassificationMessage = Extract<TriageMessage, { kind: "classification" }>;

/**
 * Where the supply this case needs can be found nearby. When the classifier named no supply
 * (supply_needed is null: the parser also turns "None specified…" and similar into null), it
 * says so plainly rather than looking up a supply that doesn't exist.
 */
function NearestStock({ supply, area }: { supply: string | null; area: string }) {
  const { t, tArea, tSupply, tName } = useT();
  const areas = useAppStore((s) => s.areas);
  const now = useAppStore((s) => s.now);
  const leads = useMemo(() => (supply === null ? [] : findNearbyStock(supply, area, areas, now)), [supply, area, areas, now]);

  return (
    <div className="mt-3 rounded-md bg-surface-raised p-3">
      <p className="text-caption font-semibold text-text-secondary">{t("triage.nearestStock")}</p>
      {supply === null ? (
        <p className="mt-1 text-body text-text-secondary">{t("triage.noSupplyNamed")}</p>
      ) : leads.length === 0 ? (
        <p className="mt-1 text-body text-text-secondary">{t("triage.noStock", { supply: tSupply(supply) })}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {leads.map((lead) => (
            <li key={lead.report.id} className="flex flex-wrap items-center gap-2 text-body">
              <MapPin aria-hidden className="shrink-0 text-text-secondary" />
              <span className="font-medium text-text-primary">
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
      className={`w-full ${CARD_ELEVATION[TIER_TOKEN[tier]]}`}
    >
      <header>
        <UrgencyBadge tier={tier} size="lg" />
        {critical && (
          <p className="mt-3 flex items-start gap-2 text-body font-bold text-critical-text">
            <Ambulance aria-hidden />
            <span>
              {t("triage.flagged")}
              <span className="block text-body font-medium">{t("triage.edhiLine")}</span>
            </span>
          </p>
        )}
      </header>

      <dl className="mt-3 space-y-3 text-body">
        {result.reason && (
          <div>
            <dt className="text-caption font-semibold text-text-secondary">{t("triage.reason")}</dt>
            <dd dir="auto" lang={textLang(result.reason)} className="text-text-secondary">
              {result.reason}
            </dd>
          </div>
        )}
        {result.recommended_action && (
          <div>
            <dt className="text-caption font-semibold text-text-secondary">{t("triage.action")}</dt>
            <dd dir="auto" lang={textLang(result.recommended_action)} className="font-medium text-text-primary">
              {result.recommended_action}
            </dd>
          </div>
        )}
        {result.supply_needed && (
          <div>
            <dt className="text-caption font-semibold text-text-secondary">{t("triage.supplyNeeded")}</dt>
            <dd dir="auto" className="text-text-primary">
              {tSupply(supply ?? result.supply_needed)}
              {/* Show the model's own wording too, unless it already contains the reports' name. */}
              {supply !== null &&
                !result.supply_needed.toLowerCase().includes(supply.toLowerCase()) &&
                !result.supply_needed.includes(tSupply(supply)) && (
                <span lang={textLang(result.supply_needed)} className="text-text-secondary"> ({result.supply_needed})</span>
              )}
            </dd>
          </div>
        )}
        {result.follow_up_question && (
          <div>
            <dt className="text-caption font-semibold text-text-secondary">{t("triage.followUp")}</dt>
            <dd dir="auto" lang={textLang(result.follow_up_question)} className="text-text-secondary">
              {result.follow_up_question}
            </dd>
          </div>
        )}
      </dl>

      {/* Routine cases don't need stock; critical and needs-supplies ones always show this block. */}
      {tier !== "routine" && <NearestStock supply={result.supply_needed === null ? null : (supply ?? result.supply_needed)} area={area} />}

      {tier === "routine" && <p className="mt-3 text-caption text-text-secondary">{t("triage.recheck")}</p>}

      <p className="mt-3 text-caption text-text-secondary">
        {t("ai.generatedBy", { model: message.model, age: formatAge(ageMs(message.at, now)) })}
      </p>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-caption text-text-secondary">
        <span>{t("triage.loggedTo", { area: tArea(area) })}</span>
        <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => goTo("dashboard", areaAnchorId(area))}
            className="inline-flex items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline"
          >
            {t("triage.viewOnDashboard")}
            <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
          </button>
          {supply && (
            <button
              type="button"
              onClick={() => goTo("matcher", matchAnchorId(area, supply), unmatchedAnchorId(supply))}
              className="inline-flex items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              {t("triage.viewMatcher")}
              <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
            </button>
          )}
        </span>
      </footer>
    </article>
  );
}
