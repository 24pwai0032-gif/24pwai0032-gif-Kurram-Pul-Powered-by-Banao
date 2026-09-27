"use client";

import { UrgencyBadge } from "@/components/UrgencyBadge";
import type { Need, UnmatchedSupply } from "@/lib/matching";
import { useFirstSight } from "@/lib/motion";
import { unmatchedAnchorId } from "@/lib/navigation";
import { useT } from "@/lib/useT";

function UnmatchedRow({ supply, needs }: { supply: string; needs: Need[] }) {
  const { t, tArea, tSupply } = useT();
  const critical = needs.some((n) => n.urgency === "critical");
  const logged = needs.flatMap((n) => n.loggedCaseIds);
  // A critical case logged moments ago that nobody nearby can cover: its badge pulses once.
  const fresh = useFirstSight(critical && logged.length > 0 ? `unmatched:${logged.join(",")}` : null);
  return (
    <li id={unmatchedAnchorId(supply)} className="flex scroll-mt-20 items-start justify-between gap-3 rounded-md py-3">
      <div className="min-w-0">
        <p className={critical ? "font-bold text-text-primary" : "font-medium text-text-primary"}>{tSupply(supply)}</p>
        <p className="mt-1 text-caption text-text-secondary">{needs.map((n) => tArea(n.area)).join(t("app.listSeparator"))}</p>
      </div>
      <UrgencyBadge tier={critical ? "critical" : "needs_supplies"} pulse={fresh} quiet={!fresh} />
    </li>
  );
}

/** Needs no other area can cover: stated plainly, not forced into a weak match (SPEC section 8). */
export function UnmatchedList({ unmatched }: { unmatched: UnmatchedSupply[] }) {
  const { t } = useT();
  if (unmatched.length === 0) return null;

  return (
    <section aria-labelledby="unmatched-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="unmatched-title" className="text-lead text-text-primary">
        {t("matcher.noMatchTitle")}
      </h2>
      <p className="mt-1 text-caption text-text-secondary">{t("matcher.noMatchIntro")}</p>
      <ul className="mt-2 divide-y divide-border">
        {unmatched.map(({ supply, needs }) => (
          <UnmatchedRow key={supply} supply={supply} needs={needs} />
        ))}
      </ul>
    </section>
  );
}
