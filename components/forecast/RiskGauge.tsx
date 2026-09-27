"use client";

import { CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { RISK_LEVELS, type RiskLevel } from "@/lib/forecast";
import { useT } from "@/lib/useT";

// Status colors with an icon and a label each, so the level never rests on color alone.
const LEVEL_STYLE: Record<RiskLevel, { color: string; icon: LucideIcon }> = {
  low: { color: "var(--stable)", icon: CircleCheck },
  elevated: { color: "var(--low)", icon: TriangleAlert },
  high: { color: "var(--critical)", icon: OctagonAlert },
};

interface RiskGaugeProps {
  level: RiskLevel | null;
  status: "loading" | "ready" | "unavailable";
}

/** Low / elevated / high closure risk (SPEC section 9), read from the forecaster's answer. */
export function RiskGauge({ level, status }: RiskGaugeProps) {
  const { t } = useT();
  const Icon = level ? LEVEL_STYLE[level].icon : null;
  const label = level
    ? t("forecast.riskValue", { level: t(`forecast.levels.${level}`) })
    : status === "loading"
      ? t("forecast.assessing")
      : t("forecast.unavailable");

  return (
    <section aria-labelledby="risk-title" aria-busy={status === "loading"} className="rounded-2xl border border-line bg-surface p-4">
      <h2 id="risk-title" className="text-sm font-semibold text-muted">
        {t("forecast.riskLabel")}
      </h2>
      <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-ink">
        {Icon && level && <Icon aria-hidden className="size-6 shrink-0" style={{ color: LEVEL_STYLE[level].color }} strokeWidth={2.25} />}
        {label}
      </p>

      <div aria-hidden className="mt-3 grid grid-cols-3 gap-1.5">
        {RISK_LEVELS.map((l) => (
          <div key={l}>
            <div
              className={`h-2 rounded-full ${status === "loading" ? "motion-safe:animate-pulse" : ""}`}
              style={{ background: l === level ? LEVEL_STYLE[l].color : "var(--surface-2)" }}
            />
            <span className={`mt-1 block text-xs ${l === level ? "font-semibold text-ink" : "text-muted"}`}>
              {t(`forecast.levels.${l}`)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">{t("forecast.estimateNote")}</p>
    </section>
  );
}
