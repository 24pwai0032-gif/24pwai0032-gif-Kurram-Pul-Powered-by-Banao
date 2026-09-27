"use client";

import { ArrowLeftRight, BookOpen, Gauge, Info, LayoutGrid, Stethoscope, type LucideIcon } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/sidebar/BrandMark";
import { computeStats, summarizeAreas } from "@/lib/dashboard";
import { parseRiskLevel, type RiskLevel } from "@/lib/forecast";
import { findMatches } from "@/lib/matching";
import { useAppStore, type ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

const NAV: { id: ViewId; icon: LucideIcon }[] = [
  { id: "about", icon: BookOpen },
  { id: "dashboard", icon: LayoutGrid },
  // The surplus matcher sits between the dashboard and triage, since it draws on both (SPEC section 8).
  { id: "matcher", icon: ArrowLeftRight },
  { id: "triage", icon: Stethoscope },
  { id: "forecast", icon: Gauge },
];

const RISK_PILL: Record<RiskLevel, string> = {
  low: "bg-stable-bg text-stable-ink",
  elevated: "bg-low-bg text-low-ink",
  high: "bg-critical text-surface",
};

function Count({ children, label, tone = "plain" }: { children: ReactNode; label: string; tone?: "plain" | "critical" }) {
  return (
    <span
      className={`ms-auto rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums ${
        tone === "critical" ? "bg-critical text-surface" : "bg-on-side/15 text-on-side"
      }`}
    >
      <span aria-hidden>{children}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * The sidebar's contents: brand, sections (with live counts, so what needs attention shows
 * from any screen), and, at the foot, the always-visible demo-data note and the language
 * switch. Used by the desktop sidebar and the phone drawer.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const areas = useAppStore((s) => s.areas);
  const triageCases = useAppStore((s) => s.triageCases);
  const now = useAppStore((s) => s.now);
  const forecast = useAppStore((s) => s.forecast);

  const critical = useMemo(() => computeStats(summarizeAreas(areas, triageCases, now)).critical, [areas, triageCases, now]);
  const matches = useMemo(() => findMatches(areas, triageCases, now).matches.length, [areas, triageCases, now]);
  const logged = triageCases.filter((c) => c.loggedAt !== undefined).length;
  const risk = forecast.status === "ready" ? parseRiskLevel(forecast.text) : null;

  const badge = (id: ViewId): ReactNode => {
    if (id === "dashboard" && critical > 0)
      return <Count tone="critical" label={t("nav.criticalCount", { count: critical })}>{critical}</Count>;
    if (id === "matcher" && matches > 0) return <Count label={t("nav.matchCount", { count: matches })}>{matches}</Count>;
    if (id === "triage" && logged > 0) return <Count label={t("nav.caseCount", { count: logged })}>{logged}</Count>;
    if (id === "forecast" && risk)
      return (
        <span className={`ms-auto rounded-full px-2 py-px text-[11px] font-bold ${RISK_PILL[risk]}`}>
          {t("forecast.riskValue", { level: t(`forecast.levels.${risk}`) })}
        </span>
      );
    return null;
  };

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate leading-tight font-bold text-on-side">{t("app.name")}</p>
          <p className="truncate text-xs text-on-side-muted">{t("about.eyebrow")}</p>
        </div>
      </div>

      <nav aria-label={t("nav.label")}>
        <ul className="grid gap-0.5">
          {NAV.map(({ id, icon: Icon }) => {
            const active = id === activeView;
            return (
              <li key={id}>
                <button
                  type="button"
                  data-nav={id}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setActiveView(id);
                    window.scrollTo({ top: 0 });
                    onNavigate?.();
                  }}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
                    active ? "bg-side-2 font-semibold text-on-side" : "text-on-side-muted hover:bg-side-2/60 hover:text-on-side"
                  }`}
                >
                  {active && <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-on-side" />}
                  <Icon aria-hidden className="size-[18px] shrink-0" />
                  <span className="min-w-0 truncate">{t(`nav.${id}`)}</span>
                  {badge(id)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto grid gap-3">
        <p className="flex items-start gap-2 rounded-lg border border-dashed border-on-side/30 px-3 py-2 text-xs text-on-side-muted">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <strong className="block font-semibold text-on-side">{t("app.demoBadge")}</strong>
            {t("app.demoBadgeText")}
          </span>
        </p>
        <LanguageToggle />
      </div>
    </div>
  );
}
