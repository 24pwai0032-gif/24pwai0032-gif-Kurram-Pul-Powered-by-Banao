"use client";

import { Clock } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { VerificationTag } from "@/components/VerificationTag";
import type { ReportView } from "@/lib/dashboard";
import { ageMs } from "@/lib/staleness";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

export function ReportRow({ report, stale }: ReportView) {
  const { t, tSupply, tName, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const age = formatAge(ageMs(report.timestamp, now));

  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <span
          className={
            stale ? "font-medium text-muted" : report.status === "critical" ? "text-[15px] font-bold text-ink" : "font-medium text-ink"
          }
        >
          {tSupply(report.supply)}
        </span>
        <SeverityBadge status={report.status} muted={stale} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <VerificationTag label={report.verified_by} />
        <span>
          {t("dashboard.area.reportedBy", { name: tName(report.reported_by) })}
          {/* The no-break space keeps the dot on the reporter's line if the time wraps. */}
          {!stale && ` · ${age}`}
        </span>
        {stale && (
          <span className="inline-flex items-center gap-1 font-semibold text-stale-ink">
            <Clock aria-hidden className="size-3.5" />
            {t("time.lastUpdated", { age })}
          </span>
        )}
      </div>
    </li>
  );
}
