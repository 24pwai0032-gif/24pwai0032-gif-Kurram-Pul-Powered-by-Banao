"use client";

import { RotateCcw } from "lucide-react";
import { SmsFallbackView } from "@/components/SmsFallbackView";
import { QuickCases } from "@/components/triage/QuickCases";
import { RecentlyLogged } from "@/components/triage/RecentlyLogged";
import { ChatComposer } from "@/components/triage/ChatComposer";
import { ChatThread } from "@/components/triage/ChatThread";
import { AreaPicker, ModeToggle, TriageDisclaimer } from "@/components/triage/TriageControls";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/**
 * Triage assistant (SPEC section 6). Chat mode for full connectivity, SMS mode for when
 * data is down; both show the same conversation, and every classified case is logged
 * to the store the dashboard reads from.
 */
export function TriageChat() {
  const { t } = useT();
  const mode = useAppStore((s) => s.triage.mode);
  const hasMessages = useAppStore((s) => s.triage.messages.length > 0);
  const pending = useAppStore((s) => s.triage.pending);
  const reset = useAppStore((s) => s.resetTriage);

  return (
    <section aria-labelledby="triage-title" className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 id="triage-title" className="text-heading text-text-primary">
            {t("triage.title")}
          </h1>
          <p className="text-body text-text-secondary">{t("triage.subtitle")}</p>
        </div>
        {hasMessages && (
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-3 py-2 text-caption font-semibold text-text-primary disabled:opacity-50"
          >
            <RotateCcw aria-hidden />
            {t("triage.newCase")}
          </button>
        )}
      </header>

      <TriageDisclaimer />

      <div className="flex flex-wrap items-end gap-3">
        <ModeToggle />
        <AreaPicker />
      </div>

      {mode === "chat" ? (
        <>
          <ChatThread />
          <ChatComposer />
        </>
      ) : (
        <>
          <RecentlyLogged />
          <QuickCases />
          <SmsFallbackView />
        </>
      )}
    </section>
  );
}
