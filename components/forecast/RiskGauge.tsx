"use client";

import { CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { RISK_LEVELS, type RiskLevel } from "@/lib/forecast";
import { CARD_ELEVATION, type SeverityToken } from "@/lib/severity";
import { useT } from "@/lib/useT";

// Severity colours with an icon and a label each, so the level never rests on colour alone.
const LEVEL_STYLE: Record<RiskLevel, { token: SeverityToken; color: string; text: string; icon: LucideIcon }> = {
  low: { token: "stable", color: "var(--color-stable)", text: "text-stable-text", icon: CircleCheck },
  elevated: { token: "warning", color: "var(--color-warning)", text: "text-warning-text", icon: TriangleAlert },
  high: { token: "critical", color: "var(--color-critical)", text: "text-critical-text", icon: OctagonAlert },
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
    <section aria-labelledby="risk-title" aria-busy={status === "loading"} className={level ? CARD_ELEVATION[LEVEL_STYLE[level].token] : "card-routine"}>
      <h2 id="risk-title" className="text-body font-semibold text-text-secondary">
        {t("forecast.riskLabel")}
      </h2>
      <p className="mt-1 flex items-center gap-2 text-heading font-semibold text-text-primary">
        {Icon && level && <Icon aria-hidden className={LEVEL_STYLE[level].text} />}
        {label}
      </p>

      <div aria-hidden className="mt-3 grid grid-cols-3 gap-2">
        {RISK_LEVELS.map((l) => (
          <div key={l}>
            <div
              className="h-2 rounded-full"
              style={{ background: l === level ? LEVEL_STYLE[l].color : "var(--color-surface-raised)" }}
            />
            <span className={`mt-1 block text-caption ${l === level ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
              {t(`forecast.levels.${l}`)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-caption text-text-secondary">{t("forecast.estimateNote")}</p>
    </section>
  );
}
