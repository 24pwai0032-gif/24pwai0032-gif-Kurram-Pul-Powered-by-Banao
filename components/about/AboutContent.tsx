"use client";

import { ArrowLeftRight, ChevronRight, Gauge, LayoutGrid, Stethoscope, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { daysBetween, MODEL_CLOSURE, SOURCES, type Source } from "@/lib/about";
import type { ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Footnote-style source line: small caption under the claim it supports, with a link. */
function Citation({ sources }: { sources: Source[] }) {
  const { t, formatDate } = useT();
  return (
    <p className="mt-2 text-xs text-muted">
      {sources.length > 1 ? t("about.sources") : t("about.source")}:{" "}
      {sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && "; "}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            {t("about.citation", { outlet: t(`about.outlets.${s.outlet}`), date: formatDate(s.date, "full") })}
          </a>
        </span>
      ))}
    </p>
  );
}

function Stat({ value, label, sources, critical = false }: {
  value: ReactNode;
  label: string;
  sources: Source[];
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-4 ${critical ? "border-s-4" : ""}`}
      style={critical ? { borderInlineStartColor: "var(--critical)" } : undefined}
    >
      <p className="text-4xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-2">{label}</p>
      <Citation sources={sources} />
    </div>
  );
}

function Point({ title, children, sources }: { title: string; children: ReactNode; sources?: Source[] }) {
  return (
    <section className="border-s-2 border-line-strong ps-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="reading mt-1 space-y-1 text-sm text-ink-2">{children}</div>
      {sources && <Citation sources={sources} />}
    </section>
  );
}

const EXPLORE: { view: Exclude<ViewId, "about">; icon: LucideIcon }[] = [
  { view: "dashboard", icon: LayoutGrid },
  { view: "matcher", icon: ArrowLeftRight },
  { view: "triage", icon: Stethoscope },
  { view: "forecast", icon: Gauge },
];

/**
 * The problem, the stakes and the mechanism, legible to someone opening the link cold:
 * the real closure the app is modeled on (with sources), why phones fail with the road,
 * the existing coordination it formalizes, and why jirga elders verify reports.
 */
export function AboutContent({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { t, formatDate } = useT();
  const days = daysBetween(MODEL_CLOSURE.start, MODEL_CLOSURE.firstConvoy);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("about.eyebrow")}</p>
        <p className="reading mt-2 text-xl leading-snug font-semibold text-ink md:text-2xl md:leading-snug">{t("app.pitch")}</p>
      </div>

      <section aria-labelledby="modeled-on-title">
        <h2 id="modeled-on-title" className="text-sm font-semibold text-ink">
          {t("about.modeledOn")}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

      <div className="space-y-5">
        <Point title={t("about.whyTitle")} sources={[SOURCES.mobileData]}>
          <p>{t("about.whyText")}</p>
          <p className="font-medium text-ink">{t("about.commsFact")}</p>
        </Point>
        <Point title={t("about.existingTitle")}>
          <p>{t("about.existingText")}</p>
        </Point>
        <Point title={t("about.jirgaTitle")} sources={[SOURCES.jirgaAccord]}>
          <p>{t("about.jirgaText")}</p>
          <p className="font-medium text-ink">{t("about.jirgaFact", { date: formatDate(MODEL_CLOSURE.jirgaAccord, "full") })}</p>
        </Point>
      </div>

      <section aria-labelledby="explore-title">
        <h2 id="explore-title" className="text-sm font-semibold text-ink">
          {t("about.exploreTitle")}
        </h2>
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
          {EXPLORE.map(({ view, icon: Icon }) => (
            <li key={view}>
              <button
                type="button"
                onClick={() => onNavigate(view)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-surface-2"
              >
                <Icon aria-hidden className="size-5 shrink-0 text-ink-2" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t(`nav.${view}`)}</span>
                  <span className="block text-xs text-muted">{t(`about.explore.${view}`)}</span>
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-muted rtl:-scale-x-100" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
