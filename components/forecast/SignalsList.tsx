"use client";

import { Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { textLang } from "@/lib/i18n";
import type { IncidentSignal, SignalSeverity } from "@/lib/schemas";
import { useT } from "@/lib/useT";

const SEVERITY_STYLE: Record<SignalSeverity, { icon: LucideIcon; className: string }> = {
  high: { icon: OctagonAlert, className: "bg-critical text-surface" },
  moderate: { icon: TriangleAlert, className: "bg-low-bg text-low-ink" },
  low: { icon: Info, className: "bg-stale-bg text-stale-ink" },
};

/** The current incident signals the forecaster weighs, newest first. */
export function SignalsList({ signals }: { signals: IncidentSignal[] }) {
  const { t, tEvent, formatDate } = useT();
  const newestFirst = [...signals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section aria-labelledby="signals-title" className="rounded-2xl border border-line bg-surface p-4">
      <h2 id="signals-title" className="text-sm font-semibold text-ink">
        {t("forecast.signalsTitle")}
      </h2>
      <ul className="mt-1 divide-y divide-line">
        {newestFirst.map((s) => {
          const { icon: Icon, className } = SEVERITY_STYLE[s.severity];
          const text = tEvent(s.signal);
          return (
            <li key={`${s.date}-${s.signal}`} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p lang={textLang(text)} dir="auto" className="reading text-sm text-ink">
                  {text}
                </p>
                <p className="mt-0.5 text-xs text-muted">{formatDate(s.date, "dayMonth")}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
                <Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
                {t(`forecast.severity.${s.severity}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
