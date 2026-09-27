"use client";

import { Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { textLang } from "@/lib/i18n";
import type { IncidentSignal, SignalSeverity } from "@/lib/schemas";
import { useT } from "@/lib/useT";

const SEVERITY_STYLE: Record<SignalSeverity, { icon: LucideIcon; className: string }> = {
  high: { icon: OctagonAlert, className: "border border-critical bg-critical-tint font-bold text-critical-text" },
  moderate: { icon: TriangleAlert, className: "bg-warning-tint text-warning-text" },
  low: { icon: Info, className: "bg-stale-tint text-stale-text" },
};

/** The current incident signals the forecaster weighs, newest first. */
export function SignalsList({ signals }: { signals: IncidentSignal[] }) {
  const { t, tEvent, formatDate } = useT();
  const newestFirst = [...signals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section aria-labelledby="signals-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="signals-title" className="text-body font-semibold text-text-primary">
        {t("forecast.signalsTitle")}
      </h2>
      <ul className="mt-1 divide-y divide-border">
        {newestFirst.map((s) => {
          const { icon: Icon, className } = SEVERITY_STYLE[s.severity];
          const text = tEvent(s.signal);
          return (
            <li key={`${s.date}-${s.signal}`} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p lang={textLang(text)} dir="auto" className="text-body text-text-primary">
                  {text}
                </p>
                <p className="mt-1 text-caption text-text-secondary">{formatDate(s.date, "dayMonth")}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-caption font-semibold ${className}`}>
                <Icon aria-hidden />
                {t(`forecast.severity.${s.severity}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
