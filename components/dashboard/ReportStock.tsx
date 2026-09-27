"use client";

import { ClipboardPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { areaAnchorId } from "@/lib/dashboard";
import { useGoTo } from "@/lib/navigation";
import { SUPPLY_STATUSES, type SupplyStatus } from "@/lib/schemas";
import { CONDITION_TOKEN } from "@/lib/severity";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

const DOT: Record<string, string> = { critical: "bg-critical", warning: "bg-warning", stable: "bg-stable", surplus: "bg-surplus" };

/**
 * How stock gets in: a pharmacy, health facility, Edhi coordinator or elder picks the area, the
 * supply and its level, and signs it. The report appears on the dashboard at once, feeds the
 * surplus matcher, and starts unverified until an elder or facility record vouches for it.
 */
export function ReportStock() {
  const { t, tArea, tSupply } = useT();
  const areas = useAppStore((s) => s.areas);
  const triageArea = useAppStore((s) => s.triage.area);
  const addReport = useAppStore((s) => s.addReport);
  const goTo = useGoTo();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Every supply any area reports, in the reports' own names.
  const supplies = useMemo(() => [...new Set(areas.flatMap((a) => a.reports.map((r) => r.supply)))].sort(), [areas]);
  const [area, setArea] = useState(triageArea ?? areas[0]?.name ?? "");
  const [supply, setSupply] = useState(supplies[0] ?? "");
  const [status, setStatus] = useState<SupplyStatus | null>(null);
  const [reporter, setReporter] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || !reporter.trim()) return;
    addReport({ area, supply, status, reportedBy: reporter });
    setOpen(false);
    setStatus(null);
    goTo("dashboard", areaAnchorId(area));
  };

  const field = "h-11 w-full rounded-md border border-border-control bg-surface px-3 text-body text-text-primary";

  return (
    <>
      <button
        type="button"
        data-report-open
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text"
      >
        <ClipboardPlus aria-hidden />
        {t("report.open")}
      </button>

      <dialog
        ref={ref}
        aria-labelledby="report-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-auto w-[min(100%-2rem,32rem)] rounded-lg border border-border bg-surface p-0 text-text-primary shadow-raised backdrop:bg-text-primary/50"
      >
        <form onSubmit={submit} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="report-title" className="text-title text-text-primary">
              {t("report.title")}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("report.cancel")}
              className="-m-2 grid size-10 shrink-0 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              <X aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-body text-text-secondary">{t("report.intro")}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-caption font-semibold text-text-secondary">
              {t("report.area")}
              <select value={area} onChange={(e) => setArea(e.target.value)} className={field} data-report-area>
                {areas.map((a) => (
                  <option key={a.name} value={a.name}>
                    {tArea(a.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-caption font-semibold text-text-secondary">
              {t("report.supply")}
              <select value={supply} onChange={(e) => setSupply(e.target.value)} className={field} data-report-supply>
                {supplies.map((s) => (
                  <option key={s} value={s}>
                    {tSupply(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-caption font-semibold text-text-secondary">{t("report.status")}</legend>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SUPPLY_STATUSES.map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-body font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-focus ${
                    status === s ? "border-brand bg-surface-raised text-text-primary" : "border-border-control text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  <input
                    type="radio"
                    name="stock-level"
                    value={s}
                    required
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                    data-report-status={s}
                  />
                  <span aria-hidden className={`size-2 rounded-full ${DOT[CONDITION_TOKEN[s]]}`} />
                  {t(`status.${s}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 grid gap-1 text-caption font-semibold text-text-secondary">
            {t("report.reporter")}
            <input
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              required
              maxLength={120}
              placeholder={t("report.reporterPlaceholder")}
              className={`${field} placeholder:text-text-secondary`}
              data-report-reporter
            />
          </label>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-2 text-body font-semibold text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              {t("report.cancel")}
            </button>
            <button
              type="submit"
              data-report-submit
              className="rounded-md bg-brand px-6 py-2 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text"
            >
              {t("report.submit")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
