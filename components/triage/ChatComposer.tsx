"use client";

import { Send } from "lucide-react";
import { QuickCases } from "@/components/triage/QuickCases";
import { RecentlyLogged } from "@/components/triage/RecentlyLogged";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Chat-mode input. Stays pinned to the bottom of the screen while the thread scrolls. */
export function ChatComposer() {
  const { t } = useT();
  const draft = useAppStore((s) => s.triage.draft);
  const setDraft = useAppStore((s) => s.setTriageDraft);
  const area = useAppStore((s) => s.triage.area);
  const pending = useAppStore((s) => s.triage.pending);
  const awaiting = useAppStore((s) => s.triage.awaiting);
  const send = useAppStore((s) => s.sendTriageMessage);

  const canSend = area !== null && !pending && draft.trim().length > 0;
  const submit = () => {
    if (canSend) void send(draft);
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(--spacing(3)+env(safe-area-inset-bottom))] backdrop-blur lg:mx-0 lg:border-t-0 lg:px-0">
      <div className="mb-3 space-y-3">
        <RecentlyLogged />
        <QuickCases />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor="triage-input" className="sr-only">
          {t("triage.inputLabel")}
        </label>
        <textarea
          id="triage-input"
          rows={2}
          value={draft}
          maxLength={500}
          dir="auto"
          disabled={area === null}
          placeholder={awaiting ? t("triage.answerPlaceholder") : t("triage.inputPlaceholder")}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="min-h-11 flex-1 resize-none rounded-lg border border-border-control bg-surface px-4 py-3 text-body text-text-primary placeholder:text-text-secondary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={t("triage.send")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-brand font-semibold text-on-brand transition-colors hover:bg-brand-text disabled:bg-surface-raised disabled:text-text-muted"
        >
          <Send aria-hidden className="rtl:-scale-x-100" />
        </button>
      </form>
      {area === null && <p className="mt-2 text-caption text-text-secondary">{t("triage.areaFirst")}</p>}
    </div>
  );
}
