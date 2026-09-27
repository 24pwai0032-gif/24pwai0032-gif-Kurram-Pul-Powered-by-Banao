"use client";

import { AiTextPanel } from "@/components/AiTextPanel";
import { ClosureTimeline } from "@/components/forecast/ClosureTimeline";
import { RiskGauge } from "@/components/forecast/RiskGauge";
import { SignalsList } from "@/components/forecast/SignalsList";
import { parseRiskLevel, withoutRiskLevelLine } from "@/lib/forecast";
import { riseOrder } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * Closure-risk forecaster (SPEC section 9): the piece that turns the system from reactive to
 * proactive. The risk badge and reasoning come from the model; the history and signals
 * are shown from the data either way.
 */
export function ForecasterPanel() {
  const { t } = useT();
  const forecast = useAppStore((s) => s.forecast);
  const requestForecast = useAppStore((s) => s.requestForecast);
  const history = useAppStore((s) => s.closureHistory);

  const level = forecast.status === "ready" ? parseRiskLevel(forecast.text) : null;
  const gaugeStatus = forecast.status === "ready" ? "ready" : forecast.status === "error" ? "unavailable" : "loading";

  return (
    <section aria-labelledby="forecast-title" className="space-y-4">
      <header className="space-y-2">
        <h1 id="forecast-title" className="text-heading text-text-primary">
          {t("forecast.title")}
        </h1>
        <p className="text-body text-text-secondary">{t("forecast.subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        {/* The spec puts the reasoning right under the badge, so they stay together on phones. */}
        <div className="rise space-y-4" style={riseOrder(0)}>
          <RiskGauge level={level} status={gaugeStatus} />
          <AiTextPanel
            headingId="forecast-reasoning-title"
            title={t("forecast.reasoningTitle")}
            state={forecast}
            onRequest={requestForecast}
            displayText={withoutRiskLevelLine}
            labels={{
              loading: t("forecast.loading", {
                closures: history.past_closures.length,
                signals: history.current_signals.length,
              }),
              notConfigured: t("forecast.notConfigured"),
              failed: t("forecast.failed"),
            }}
          />
        </div>
        <div className="rise space-y-4" style={riseOrder(1)}>
          <SignalsList signals={history.current_signals} />
          <ClosureTimeline closures={history.past_closures} />
        </div>
      </div>
    </section>
  );
}
