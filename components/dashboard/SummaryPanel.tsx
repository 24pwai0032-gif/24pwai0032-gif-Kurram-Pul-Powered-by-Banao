"use client";

import { AiTextPanel } from "@/components/AiTextPanel";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** The aggregation engine's 30-second read for responders (SPEC section 7). */
export function SummaryPanel() {
  const { t } = useT();
  const summary = useAppStore((s) => s.summary);
  const requestSummary = useAppStore((s) => s.requestSummary);
  const reportCount = useAppStore((s) => s.areas.reduce((n, area) => n + area.reports.length, 0));
  const caseCount = useAppStore((s) => s.triageCases.length);

  return (
    <AiTextPanel
      headingId="summary-title"
      title={t("dashboard.summary.title")}
      state={summary}
      onRequest={requestSummary}
      labels={{
        loading: t("dashboard.summary.loading", { reports: reportCount, cases: caseCount }),
        notConfigured: t("dashboard.summary.notConfigured"),
        failed: t("dashboard.summary.failed"),
        outdated: t("dashboard.summary.outdated"),
      }}
    />
  );
}
