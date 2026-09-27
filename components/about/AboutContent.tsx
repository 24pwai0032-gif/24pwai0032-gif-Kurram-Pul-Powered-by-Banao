"use client";

import { ArrowLeftRight, Building2, ChevronRight, Gauge, LayoutGrid, MessageSquareText, Stethoscope, Truck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { HowItWorks } from "@/components/about/HowItWorks";
import { KurramMap } from "@/components/dashboard/KurramMap";
import { daysBetween, MODEL_CLOSURE, SOURCES, type Source } from "@/lib/about";
import { riseOrder } from "@/lib/motion";
import type { ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Footnote-style source line: small and quiet under the claim it supports, with a link. */
function Citation({ sources }: { sources: Source[] }) {
  const { t, formatDate } = useT();
  return (
    <p className="mt-3 text-caption text-text-secondary">
      {sources.length > 1 ? t("about.sources") : t("about.source")}:{" "}
      {sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && "; "}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border-control underline-offset-4 transition-colors hover:text-text-primary hover:decoration-current"
          >
            {t("about.citation", { outlet: t(`about.outlets.${s.outlet}`), date: formatDate(s.date, "full") })}
          </a>
        </span>
      ))}
    </p>
  );
}

/**
 * One of the two figures the page turns on. Both use the same padding so their numbers share a
 * baseline; the child deaths carry critical elevation (rust border and shadow) and a rust figure.
 */
function Stat({ value, label, sources, critical = false }: {
  value: ReactNode;
  label: string;
  sources: Source[];
  critical?: boolean;
}) {
  return (
    <div className={critical ? "card-critical" : "rounded-lg border border-border bg-surface p-6"}>
      <p className={`font-display text-display font-semibold tabular-nums ${critical ? "text-critical-text" : "text-text-primary"}`}>
        {value}
      </p>
      <p className="mt-2 text-body text-text-primary">{label}</p>
      <Citation sources={sources} />
    </div>
  );
}

const CHANNELS: { id: "sms" | "office" | "outside"; icon: LucideIcon }[] = [
  { id: "sms", icon: MessageSquareText },
  { id: "office", icon: Building2 },
  { id: "outside", icon: Truck },
];

/** How it is used with mobile data cut: SMS from any phone, office lines, and teams outside the district. */
function WhenOffline() {
  const { t } = useT();
  return (
    <section aria-labelledby="offline-title" className="@container">
      <h2 id="offline-title" className="text-title text-text-primary">
        {t("about.offline.title")}
      </h2>
      <p className="mt-2 max-w-3xl text-body text-text-secondary">{t("about.offline.intro")}</p>
      <p className="mt-2 max-w-3xl text-body font-semibold text-text-primary">{t("about.commsFact")}</p>
      <Citation sources={[SOURCES.mobileData]} />
      <ul className="mt-4 grid gap-4 @xl:grid-cols-3">
        {CHANNELS.map(({ id, icon: Icon }) => (
          <li key={id} className="card-routine flex gap-3">
            <Icon aria-hidden className="mt-1 text-brand" />
            <div>
              <h3 className="text-lead text-text-primary">{t(`about.offline.${id}.title`)}</h3>
              <p className="mt-1 text-body text-text-secondary">{t(`about.offline.${id}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const WHO = ["hospital", "pharmacy", "edhi", "elders"] as const;

/** The first users, all people who already coordinate during closures; no new institution needed. */
function WhoUsesIt() {
  const { t, formatDate } = useT();
  return (
    <section aria-labelledby="who-title" className="@container">
      <h2 id="who-title" className="text-title text-text-primary">
        {t("about.who.title")}
      </h2>
      <p className="mt-2 max-w-3xl text-body text-text-secondary">{t("about.who.intro")}</p>
      <ul className="mt-4 grid items-start gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
        {WHO.map((who) => (
          <li key={who} className="card-routine">
            <h3 className="text-lead text-text-primary">{t(`about.who.${who}.title`)}</h3>
            <p className="mt-1 text-body text-text-secondary">{t(`about.who.${who}.body`)}</p>
            {/* Why elders: Kurram's closures are settled through jirgas. */}
            {who === "elders" && (
              <>
                <p className="mt-2 text-body font-medium text-text-primary">
                  {t("about.jirgaFact", { date: formatDate(MODEL_CLOSURE.jirgaAccord, "full") })}
                </p>
                <Citation sources={[SOURCES.jirgaAccord]} />
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const PHOTO_PAGE = "https://commons.wikimedia.org/wiki/File:Parachinar_in_winter.jpg";

const EXPLORE: { view: Exclude<ViewId, "about">; icon: LucideIcon }[] = [
  { view: "dashboard", icon: LayoutGrid },
  { view: "matcher", icon: ArrowLeftRight },
  { view: "triage", icon: Stethoscope },
  { view: "forecast", icon: Gauge },
];

/**
 * The problem, the stakes and the mechanism, legible to someone opening the link cold:
 * the real closure the app is modeled on (with sources), how it works, where it happens, how it
 * is used with mobile data cut, and who uses it first (with why jirga elders verify reports).
 *
 * Laid out by its own width (container queries).
 */
/**
 * The two figures the page turns on, the real closure the app is modeled on, each with its
 * source. Shown on the About page and in the first-visit intro.
 */
export function ModelFigures() {
  const { t, formatDate } = useT();
  const days = daysBetween(MODEL_CLOSURE.start, MODEL_CLOSURE.firstConvoy);
  return (
    <section aria-labelledby="modeled-on-title" className="@container">
      <h2 id="modeled-on-title" className="text-title text-text-primary">
        {t("about.modeledOn")}
      </h2>
      <div className="mt-4 grid gap-4 @xl:grid-cols-2">
        <Stat
          value={t("about.closureStat", { days })}
          label={t("about.closureLabel", {
            start: formatDate(MODEL_CLOSURE.start, "full"),
            end: formatDate(MODEL_CLOSURE.firstConvoy, "full"),
          })}
          sources={[SOURCES.closureStart, SOURCES.firstConvoy]}
        />
        <Stat
          value={<span dir="ltr">{MODEL_CLOSURE.childDeathsAtLeast}+</span>}
          label={t("about.childrenLabel")}
          sources={[SOURCES.childDeaths]}
          critical
        />
      </div>
    </section>
  );
}

export function AboutContent({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { t } = useT();

  return (
    <div className="@container space-y-12">
      <div className="rise" style={riseOrder(1)}>
        <ModelFigures />
      </div>

      <div className="rise" style={riseOrder(2)}>
        <HowItWorks />
      </div>

      <KurramMap variant="place" title={t("about.mapTitle")} caption={t("about.mapCaption")} className="rise" style={riseOrder(3)} />

      <div className="rise" style={riseOrder(4)}>
        <WhenOffline />
      </div>

      <div className="rise" style={riseOrder(5)}>
        <WhoUsesIt />
      </div>

      <section aria-labelledby="explore-title" className="rise" style={riseOrder(6)}>
        <h2 id="explore-title" className="text-title text-text-primary">
          {t("about.exploreTitle")}
        </h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {EXPLORE.map(({ view, icon: Icon }) => (
            <li key={view}>
              <button
                type="button"
                onClick={() => onNavigate(view)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-surface-raised"
              >
                <Icon aria-hidden className="text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-text-primary">{t(`nav.${view}`)}</span>
                  <span className="block text-caption text-text-secondary">{t(`about.explore.${view}`)}</span>
                </span>
                <ChevronRight aria-hidden className="text-text-secondary rtl:-scale-x-100" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* The header photo's licence (CC BY-SA 4.0) asks for credit; it sits here, off the picture. */}
      <p data-credit className="text-caption text-text-secondary">
        <a
          href={PHOTO_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border-control underline-offset-4 transition-colors hover:text-text-primary hover:decoration-current"
        >
          {t("about.photoCredit", { name: "Mujtaba Hassan" })}
        </a>
      </p>
    </div>
  );
}
