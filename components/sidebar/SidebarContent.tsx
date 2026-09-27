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
  low: "bg-stable-tint text-stable-text",
  elevated: "bg-warning-tint text-warning-text",
  high: "border border-critical bg-critical-tint text-critical-text",
};

function Count({ children, label, tone = "plain" }: { children: ReactNode; label: string; tone?: "plain" | "critical" }) {
  return (
    <span
      className={`ms-auto rounded-full px-2 text-caption font-bold tabular-nums ${
        tone === "critical" ? "border border-critical bg-critical-tint text-critical-text" : "bg-background text-text-secondary"
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
        <span className={`ms-auto rounded-full px-2 text-caption font-bold ${RISK_PILL[risk]}`}>
          {t("forecast.riskValue", { level: t(`forecast.levels.${risk}`) })}
        </span>
      );
    return null;
  };

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-6">
      <div className="flex items-center gap-3 px-2">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate font-display text-lead font-semibold text-text-primary">{t("app.name")}</p>
          <p className="truncate text-caption text-text-secondary">{t("about.eyebrow")}</p>
        </div>
      </div>

      <nav aria-label={t("nav.label")}>
        <ul className="grid gap-1">
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
                  className={`relative flex w-full items-center gap-3 rounded-md px-3 py-3 text-start text-body transition-colors ${
                    active ? "bg-surface-raised font-semibold text-text-primary" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                  }`}
                >
                  {active && <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-brand" />}
                  <Icon aria-hidden className={active ? "text-brand" : undefined} />
                  <span className="min-w-0 truncate">{t(`nav.${id}`)}</span>
                  {badge(id)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto grid gap-3">
        <p className="flex items-start gap-2 rounded-md border border-dashed border-border-control px-3 py-2 text-caption text-text-secondary">
          <Info aria-hidden />
          <span>
            <strong className="block font-semibold text-text-primary">{t("app.demoBadge")}</strong>
            {t("app.demoBadgeText")}
          </span>
        </p>
        <LanguageToggle />
      </div>
    </div>
  );
}
