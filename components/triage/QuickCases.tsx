"use client";

import { UrgencyBadge } from "@/components/UrgencyBadge";
import type { UrgencyTier } from "@/lib/schemas";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * One-tap example cases, one per urgency tier, so anyone reviewing the app sees the full
 * range (above all the critical path) without typing. Each carries the area it's logged
 * against if none is chosen yet: the infant goes to Parachinar's DHQ Hospital, and the
 * insulin case to Sadda, where the surplus matcher then finds Alizai's spare insulin.
 */
const QUICK_CASES: { tier: UrgencyTier; area: string }[] = [
  { tier: "critical", area: "Parachinar City Center" },
  { tier: "needs_supplies", area: "Sadda" },
  { tier: "routine", area: "Alizai" },
];

export function QuickCases() {
  const { t } = useT();
  const pending = useAppStore((s) => s.triage.pending);
  const area = useAppStore((s) => s.triage.area);
  const setArea = useAppStore((s) => s.setTriageArea);
  const send = useAppStore((s) => s.sendTriageMessage);

  const run = (tier: UrgencyTier, suggestedArea: string) => {
    if (area === null) setArea(suggestedArea);
    void send(t(`triage.quick.${tier}.text`), { newCase: true });
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted">{t("triage.quickTitle")}</p>
      <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {QUICK_CASES.map(({ tier, area: suggestedArea }) => (
          <button
            key={tier}
            type="button"
            data-quick-case={tier}
            disabled={pending}
            onClick={() => run(tier, suggestedArea)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface py-1 ps-1 pe-3 text-xs font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
          >
            <UrgencyBadge tier={tier} />
            {t(`triage.quick.${tier}.label`)}
          </button>
        ))}
      </div>
    </div>
  );
}
