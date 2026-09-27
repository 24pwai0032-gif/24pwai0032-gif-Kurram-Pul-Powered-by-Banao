"use client";

import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { areaAnchorId } from "@/lib/dashboard";
import { matchAnchorId, unmatchedAnchorId, useGoTo } from "@/lib/navigation";
import { ageMs } from "@/lib/staleness";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * The newest case logged from triage, with links straight to its dashboard card and its
 * surplus match, so the connection between the three screens is visible from here.
 */
export function RecentlyLogged() {
  const { t, tArea, tSupply, formatAge } = useT();
  const triageCases = useAppStore((s) => s.triageCases);
  const now = useAppStore((s) => s.now);
  const goTo = useGoTo();
  const live = useMemo(() => triageCases.filter((c) => c.loggedAt !== undefined).reverse(), [triageCases]);

  if (live.length === 0) return null;
  const latest = live[0];
  const link = "inline-flex items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline";

  return (
    <div role="status" data-recently-logged className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-surface px-3 py-2 text-caption">
      <span className="font-semibold text-text-primary">{t("triage.recentTitle")}:</span>
      <UrgencyBadge tier={latest.urgency_tier} />
      <span className="font-medium text-text-primary">{tArea(latest.area)}</span>
      {latest.supply_needed && <span className="text-text-secondary">· {tSupply(latest.supply_needed)}</span>}
      {latest.loggedAt && <span className="text-text-secondary">· {formatAge(ageMs(latest.loggedAt, now))}</span>}
      {live.length > 1 && <span className="text-text-secondary">({t("triage.recentMore", { count: live.length - 1 })})</span>}
      <span className="ms-auto inline-flex gap-3">
        <button type="button" className={link} onClick={() => goTo("dashboard", areaAnchorId(latest.area))}>
          {t("triage.viewShortages")}
          <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
        </button>
        {latest.supply_needed && (
          <button
            type="button"
            className={link}
            onClick={() =>
              goTo("matcher", matchAnchorId(latest.area, latest.supply_needed!), unmatchedAnchorId(latest.supply_needed!))
            }
          >
            {t("triage.viewMatcher")}
            <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
          </button>
        )}
      </span>
    </div>
  );
}
