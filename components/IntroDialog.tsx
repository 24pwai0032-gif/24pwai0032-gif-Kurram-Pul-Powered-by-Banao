"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ModelFigures } from "@/components/about/AboutContent";
import { HowItWorks } from "@/components/about/HowItWorks";
import { BrandMark } from "@/components/sidebar/BrandMark";
import { useTour } from "@/components/tour/useTour";
import { useAppStore, type ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * Shown once, on a visitor's first load: what this is in one sentence, the two facts behind it,
 * the loop in four steps, and a choice: a 60-second guided tour, or exploring alone. A native
 * <dialog> gives focus trapping, Escape to close and a backdrop for free.
 */
export function IntroDialog() {
  const { t } = useT();
  const open = useAppStore((s) => s.introOpen);
  const dismiss = useAppStore((s) => s.dismissIntro);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { start } = useTour();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const close = (view?: ViewId) => {
    ref.current?.close();
    dismiss();
    if (view) {
      setActiveView(view);
      window.scrollTo({ top: 0 });
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="intro-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="m-auto max-h-[min(100dvh-2rem,56rem)] w-[min(100%-2rem,46rem)] overflow-y-auto rounded-lg border border-border bg-background p-0 text-text-primary backdrop:bg-background/80"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p id="intro-title" className="font-display text-lead font-semibold text-text-primary">
                {t("app.name")}
              </p>
              <p className="text-caption text-text-secondary">{t("about.eyebrow")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => close()}
            aria-label={t("about.close")}
            className="-m-2 grid size-10 shrink-0 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          >
            <X aria-hidden />
          </button>
        </div>

        <p className="mt-6 font-display text-title text-text-primary md:text-heading">{t("app.pitch")}</p>

        <div className="mt-8">
          <ModelFigures />
        </div>

        <div className="mt-8">
          <HowItWorks />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            autoFocus
            data-tour-start
            onClick={() => {
              ref.current?.close();
              start();
            }}
            className="rounded-md bg-brand px-6 py-3 text-body font-semibold text-on-brand transition-colors hover:bg-brand-text"
          >
            {t("tour.start")}
          </button>
          <button
            type="button"
            onClick={() => close("dashboard")}
            className="rounded-md border border-border-control px-6 py-3 text-body font-semibold text-text-primary transition-colors hover:bg-surface-raised"
          >
            {t("about.introExplore")}
          </button>
        </div>
        <button
          type="button"
          onClick={() => close("about")}
          className="mt-4 text-body font-semibold text-brand-text underline-offset-4 hover:underline"
        >
          {t("about.introReadMore")}
        </button>
      </div>
    </dialog>
  );
}
