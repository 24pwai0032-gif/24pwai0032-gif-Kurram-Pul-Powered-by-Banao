"use client";

import { closureStats } from "@/lib/forecast";
import { textLang } from "@/lib/i18n";
import type { ClosureEvent } from "@/lib/schemas";
import { useT } from "@/lib/useT";

/**
 * Past closures in date order, each a bar as long as the closure lasted (SPEC section 9:
 * "a short timeline visualization of past closures and durations"). A dashed line marks
 * the median. Every bar is labelled with its length and trigger, so nothing needs hover.
 */
export function ClosureTimeline({ closures }: { closures: ClosureEvent[] }) {
  const { t, tEvent, formatDate } = useT();
  const stats = closureStats(closures);
  const scale = stats.longestDays || 1;
  const medianPct = (stats.medianDays / scale) * 100;
  const oldestFirst = [...closures].sort((a, b) => a.start.localeCompare(b.start));

  const tiles = [
    { label: t("forecast.stats.count"), value: String(stats.count) },
    { label: t("forecast.stats.median"), value: t("forecast.days", { count: stats.medianDays }) },
    { label: t("forecast.stats.longest"), value: t("forecast.days", { count: stats.longestDays }) },
  ];

  return (
    <section aria-labelledby="history-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="history-title" className="text-body font-semibold text-text-primary">
        {t("forecast.historyTitle")}
      </h2>
      <p className="mt-1 text-caption text-text-secondary">{t("forecast.historyCaption")}</p>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-surface-raised px-3 py-2">
            <dt className="text-caption text-text-secondary">{label}</dt>
            <dd className="mt-1 text-body font-semibold tabular-nums text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      <ol className="mt-4 space-y-3">
        {oldestFirst.map((c) => (
          <li key={c.start} className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <span className="text-caption font-medium text-text-secondary">{formatDate(c.start, "monthYear")}</span>
            <div className="relative h-3" title={`${c.start} → ${c.end}: ${tEvent(c.trigger)}`}>
              <div
                className="h-full rounded-e-sm bg-text-secondary"
                style={{ width: `${(c.duration_days / scale) * 100}%`, minWidth: 4 }}
              />
              <span
                aria-hidden
                className="absolute -inset-y-0.5 border-s border-dashed border-border-control"
                style={{ insetInlineStart: `${medianPct}%` }}
              />
            </div>
            <span className="text-caption font-semibold tabular-nums text-text-primary">{t("forecast.days", { count: c.duration_days })}</span>
            <span lang={textLang(tEvent(c.trigger))} dir="auto" className="col-span-2 col-start-2 text-caption text-text-secondary">
              {tEvent(c.trigger)}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 flex items-center gap-2 text-caption text-text-secondary">
        <span aria-hidden className="inline-block h-3 border-s border-dashed border-border-control" />
        {t("forecast.medianLine", { count: stats.medianDays })}
      </p>
    </section>
  );
}
