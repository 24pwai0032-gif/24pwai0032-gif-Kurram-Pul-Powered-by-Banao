"use client";

import { ArrowDown, BellRing, CircleCheck, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { VerificationTag } from "@/components/VerificationTag";
import type { SurplusMatch } from "@/lib/matching";
import { matchAnchorId } from "@/lib/navigation";
import type { ReportRecord } from "@/lib/schemas";
import { useFirstSight } from "@/lib/motion";
import { CARD_ELEVATION, TIER_TOKEN } from "@/lib/severity";
import { ageMs, HOUR_MS, isStale } from "@/lib/staleness";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

function Endpoint({ label, area, report, children }: {
  label: string;
  area: string;
  report: ReportRecord | null;
  children?: ReactNode;
}) {
  const { tArea, tName } = useT();
  const now = useAppStore((s) => s.now);
  return (
    <div className="flex gap-3">
      <span className="w-12 shrink-0 pt-1 text-caption font-semibold tracking-wide text-text-secondary uppercase">{label}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary">{tArea(area)}</p>
        {report && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
            <span>{tName(report.reported_by)}</span>
            <SeverityBadge status={report.status} muted={isStale(report.timestamp, now)} quiet />
            <VerificationTag label={report.verified_by} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-2 text-caption font-semibold text-stale-text">
      <Clock aria-hidden />
      {children}
    </p>
  );
}

/** One matched pair (SPEC section 8): where the spare stock is, where it's needed, and why. */
export function MatchCard({ match }: { match: SurplusMatch }) {
  const { t, tArea, tSupply, tName, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const notifiedAt = useAppStore((s) => s.notified[match.id]);
  const notify = useAppStore((s) => s.notifyCoordinator);

  const { need, offers } = match;
  const [best, ...others] = offers;
  const supply = tSupply(need.supply);
  const hoursOld = (report: ReportRecord) => Math.floor(ageMs(report.timestamp, now) / HOUR_MS);
  const critical = need.urgency === "critical";
  // The triage flow reaching the matcher: a critical need with a case logged moments ago pulses once.
  const fresh = useFirstSight(critical && need.loggedCaseIds.length > 0 ? `matcher:${need.loggedCaseIds.join(",")}` : null);

  const rationale = t("matcher.rationale", {
    from: tArea(best.area),
    to: tArea(need.area),
    offer: t(best.report.status === "surplus" ? "matcher.offer.surplus" : "matcher.offer.stable", { supply }),
    need: t(`matcher.need.${need.urgency}`, { supply }),
    distance: best.distance === 1 ? t("matcher.distance.near") : t("matcher.distance.far", { hops: best.distance }),
  });

  return (
    <article
      id={matchAnchorId(need.area, need.supply)}
      aria-label={`${supply}: ${tArea(best.area)} → ${tArea(need.area)}`}
      className={`scroll-mt-20 ${CARD_ELEVATION[TIER_TOKEN[need.urgency]]}`}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className={`text-text-primary ${critical ? "text-title" : "text-lead"}`}>{supply}</h3>
        <UrgencyBadge tier={need.urgency} pulse={fresh} />
      </header>

      <div className="mt-3">
        <Endpoint label={t("matcher.from")} area={best.area} report={best.report} />
        <div className="flex items-center gap-3 py-2">
          <span className="flex w-12 shrink-0 justify-center">
            <ArrowDown aria-hidden className="text-text-secondary" />
          </span>
          <span className="text-caption font-semibold text-text-secondary">
            {best.distance === 1 ? t("matcher.nextDoor") : t("matcher.hopsAway", { hops: best.distance })}
          </span>
        </div>
        <Endpoint label={t("matcher.to")} area={need.area} report={need.report}>
          {need.triageCases > 0 && (
            <p className="mt-1 text-caption font-medium text-text-secondary">{t("matcher.triageWaiting", { count: need.triageCases })}</p>
          )}
        </Endpoint>
      </div>

      <p className="mt-3 text-body text-text-secondary">{rationale}</p>
      {isStale(best.report.timestamp, now) && (
        <Warning>{t("matcher.staleOffer", { hours: hoursOld(best.report) })}</Warning>
      )}
      {need.report && isStale(need.report.timestamp, now) && (
        <Warning>{t("matcher.staleNeed", { hours: hoursOld(need.report) })}</Warning>
      )}
      {others.length > 0 && (
        <p className="mt-2 text-caption text-text-secondary">
          {t("matcher.alsoFrom", {
            sources: others.map((o) => `${tName(o.report.reported_by)} (${tArea(o.area)})`).join(t("app.listSeparator")),
          })}
        </p>
      )}

      <footer className="mt-3 border-t border-border pt-3">
        {notifiedAt ? (
          <p role="status" className="inline-flex items-center gap-2 text-body font-semibold text-stable-text">
            <CircleCheck aria-hidden />
            {t("matcher.notified", { age: formatAge(ageMs(notifiedAt, now)) })}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => notify(match.id)}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text"
          >
            <BellRing aria-hidden />
            {t("matcher.notify")}
          </button>
        )}
      </footer>
    </article>
  );
}
