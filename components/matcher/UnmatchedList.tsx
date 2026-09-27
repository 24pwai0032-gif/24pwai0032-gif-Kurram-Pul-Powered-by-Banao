"use client";

import { PackageX } from "lucide-react";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import type { UnmatchedSupply } from "@/lib/matching";
import { unmatchedAnchorId } from "@/lib/navigation";
import { useT } from "@/lib/useT";

/** Needs no other area can cover: stated plainly, not forced into a weak match (SPEC section 8). */
export function UnmatchedList({ unmatched }: { unmatched: UnmatchedSupply[] }) {
  const { t, tArea, tSupply } = useT();
  if (unmatched.length === 0) return null;

  return (
    <section aria-labelledby="unmatched-title" className="rounded-2xl border border-line bg-surface p-4">
      <h2 id="unmatched-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
        <PackageX aria-hidden className="size-4 text-muted" />
        {t("matcher.noMatchTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted">{t("matcher.noMatchIntro")}</p>
      <ul className="mt-2 divide-y divide-line">
        {unmatched.map(({ supply, needs }) => (
          <li key={supply} id={unmatchedAnchorId(supply)} className="flex scroll-mt-20 items-start justify-between gap-3 rounded-lg py-2.5">
            <div className="min-w-0">
              <p className={needs.some((n) => n.urgency === "critical") ? "font-bold text-ink" : "font-medium text-ink"}>
                {tSupply(supply)}
              </p>
              <p className="mt-0.5 text-xs text-ink-2">
                {needs.map((n) => tArea(n.area)).join(t("app.listSeparator"))}
              </p>
            </div>
            <UrgencyBadge tier={needs.some((n) => n.urgency === "critical") ? "critical" : "needs_supplies"} />
          </li>
        ))}
      </ul>
    </section>
  );
}
