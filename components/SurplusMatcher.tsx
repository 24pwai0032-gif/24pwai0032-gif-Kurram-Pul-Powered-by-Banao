"use client";

import { useMemo } from "react";
import { AiTextPanel } from "@/components/AiTextPanel";
import { MatchCard } from "@/components/matcher/MatchCard";
import { UnmatchedList } from "@/components/matcher/UnmatchedList";
import { findMatches } from "@/lib/matching";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * Surplus matcher (SPEC section 8): closes the loop from visibility to action by pairing
 * spare stock in one area with shortages nearby. Rule-based cards work with no connection;
 * the AI review adds judgment when the LLM is reachable.
 */
export function SurplusMatcher() {
  const { t } = useT();
  const areas = useAppStore((s) => s.areas);
  const triageCases = useAppStore((s) => s.triageCases);
  const now = useAppStore((s) => s.now);
  const matchReview = useAppStore((s) => s.matchReview);
  const requestMatchReview = useAppStore((s) => s.requestMatchReview);

  const { matches, unmatched } = useMemo(() => findMatches(areas, triageCases, now), [areas, triageCases, now]);
  const reportCount = areas.reduce((n, area) => n + area.reports.length, 0);

  return (
    <section aria-labelledby="matcher-title" className="space-y-4">
      <header className="space-y-2">
        <h1 id="matcher-title" className="text-xl font-semibold text-ink">
          {t("matcher.title")}
        </h1>
        <p className="text-sm text-ink-2">{t("matcher.subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink">{t("matcher.matchesTitle", { count: matches.length })}</h2>
            <p className="mt-0.5 text-xs text-muted">{t("matcher.rules")}</p>
          </div>
          {matches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-strong bg-surface p-4 text-sm text-ink-2">
              {t("matcher.none")}
            </p>
          ) : (
            <ol className="space-y-3">
              {matches.map((match) => (
                <li key={match.id}>
                  <MatchCard match={match} />
                </li>
              ))}
            </ol>
          )}
          <p className="text-xs text-muted">{t("matcher.notifyNote")}</p>
        </div>

        <div className="space-y-4">
          <UnmatchedList unmatched={unmatched} />
          <AiTextPanel
            headingId="match-review-title"
            title={t("matcher.review.title")}
            state={matchReview}
            onRequest={requestMatchReview}
            labels={{
              loading: t("matcher.review.loading", { reports: reportCount }),
              notConfigured: t("matcher.review.notConfigured"),
              failed: t("matcher.review.failed"),
              outdated: t("matcher.review.outdated"),
            }}
          />
        </div>
      </div>
    </section>
  );
}
