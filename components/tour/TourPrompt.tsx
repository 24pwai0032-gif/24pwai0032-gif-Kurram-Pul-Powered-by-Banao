"use client";

import { PlayCircle, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";
import { useTour } from "@/components/tour/useTour";

/**
 * A first visit's invitation, as a notification rather than a wall: the visitor lands on the
 * About page (the problem and the stakes) and this card offers the 60-second guided tour.
 * "Not now" remembers the choice; the tour stays one tap away in the sidebar.
 */
export function TourPrompt() {
  const { t } = useT();
  const open = useAppStore((s) => s.introOpen && s.tour === null);
  const dismiss = useAppStore((s) => s.dismissIntro);
  const { start } = useTour();
  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-labelledby="tour-prompt-title"
      data-tour-prompt
      className="rise fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-raised lg:inset-x-auto lg:end-6 lg:bottom-6 lg:w-96"
      style={{ animationDelay: "var(--duration-base)" }}
    >
      {/* A strip of signal yellow, as on a road sign. */}
      <div aria-hidden className="h-1 bg-signal" />
      <div className="flex gap-3 p-4">
        <PlayCircle aria-hidden className="mt-1 text-brand" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 id="tour-prompt-title" className="text-lead text-text-primary">
              {t("tour.promptTitle")}
            </h2>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("tour.notNow")}
              className="-m-2 grid size-9 shrink-0 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              <X aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-body text-text-secondary">{t("tour.promptBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              autoFocus
              data-tour-start
              onClick={start}
              className="rounded-md bg-brand px-4 py-2 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text"
            >
              {t("tour.promptStart")}
            </button>
            <button
              type="button"
              data-tour-dismiss
              onClick={dismiss}
              className="rounded-md px-4 py-2 text-body font-semibold text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              {t("tour.notNow")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
