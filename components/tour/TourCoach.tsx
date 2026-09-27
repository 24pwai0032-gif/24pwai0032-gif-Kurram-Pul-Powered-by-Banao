"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TOUR_COUNTED, TOUR_STEPS } from "@/lib/tour";
import { useT } from "@/lib/useT";
import { useTour } from "@/components/tour/useTour";

/**
 * The guided tour's coach: a small panel at the bottom of the screen (bottom corner on desktop)
 * saying what this step shows and why it matters, with Back and Next. It stays out of the way
 * of the content it points at; the page leaves room for it while it's open.
 */
export function TourCoach() {
  const { t } = useT();
  const step = useAppStore((s) => s.tour);
  const pending = useAppStore((s) => s.triage.pending);
  const { go, exit } = useTour();
  if (step === null) return null;

  const index = TOUR_STEPS.indexOf(step);
  const last = step === "done";
  // The first step waits for the real classification before moving on.
  const waiting = step === "triage" && pending;

  return (
    <section
      aria-label={t("tour.label")}
      aria-live="polite"
      data-tour-step={step}
      className="rise fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-lg border border-brand bg-surface-raised p-4 shadow-raised lg:inset-x-auto lg:end-6 lg:bottom-6 lg:w-96"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption font-semibold text-brand-text">
          {t("tour.label")}
          {!last && <> · {t("tour.step", { n: index + 1, total: TOUR_COUNTED })}</>}
        </p>
        <button
          type="button"
          onClick={exit}
          aria-label={t("tour.exit")}
          className="-m-2 grid size-9 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          <X aria-hidden />
        </button>
      </div>

      {/* Progress: one segment per step. */}
      <div aria-hidden className="mt-3 flex gap-1">
        {TOUR_STEPS.slice(0, TOUR_COUNTED).map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-brand" : "bg-border"}`} />
        ))}
      </div>

      <h2 className="mt-3 text-lead text-text-primary">{t(`tour.steps.${step}.title`)}</h2>
      <p className="mt-1 text-body text-text-secondary">{t(`tour.steps.${step}.body`)}</p>

      <div className="mt-4 flex items-center justify-end gap-2">
        {index > 0 && !last && (
          <button
            type="button"
            onClick={() => go(TOUR_STEPS[index - 1])}
            className="rounded-md border border-border-control px-4 py-2 text-body font-semibold text-text-primary transition-colors hover:bg-surface"
          >
            {t("tour.back")}
          </button>
        )}
        <button
          type="button"
          data-tour-next
          disabled={waiting}
          onClick={() => (last ? exit() : go(TOUR_STEPS[index + 1]))}
          className="rounded-md bg-brand px-4 py-2 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text disabled:bg-surface disabled:text-text-secondary"
        >
          {waiting ? t("tour.waiting") : last ? t("tour.finish") : t("tour.next")}
        </button>
      </div>
    </section>
  );
}
