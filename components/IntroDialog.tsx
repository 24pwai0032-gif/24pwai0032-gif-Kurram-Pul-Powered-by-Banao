"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AboutContent } from "@/components/about/AboutContent";
import { useAppStore, type ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * Shown once, on a visitor's first load: the "About this crisis" content, so someone opening
 * the link cold sees the problem and the stakes before the dashboard. A native <dialog>
 * gives focus trapping, Escape to close and a backdrop for free.
 */
export function IntroDialog() {
  const { t } = useT();
  const open = useAppStore((s) => s.introOpen);
  const dismiss = useAppStore((s) => s.dismissIntro);
  const setActiveView = useAppStore((s) => s.setActiveView);
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
      className="m-auto max-h-[min(100dvh-2rem,56rem)] w-[min(100%-2rem,44rem)] overflow-y-auto rounded-lg border border-border bg-background p-0 text-text-primary backdrop:bg-background/80"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <p id="intro-title" className="font-semibold text-text-primary">
          {t("app.name")} · {t("about.title")}
        </p>
        <button
          type="button"
          onClick={() => close()}
          aria-label={t("about.close")}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-raised"
        >
          <X aria-hidden />
        </button>
      </div>
      <div className="px-6 py-6">
        <AboutContent onNavigate={close} />
      </div>
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          autoFocus
          onClick={() => close("dashboard")}
          className="w-full rounded-full py-3 text-body bg-brand font-semibold text-on-brand transition-colors hover:bg-brand-text"
        >
          {t("about.introContinue")}
        </button>
      </div>
    </dialog>
  );
}
