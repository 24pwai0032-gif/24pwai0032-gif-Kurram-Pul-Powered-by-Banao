"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { ClassificationCard } from "@/components/triage/ClassificationCard";
import { textLang } from "@/lib/i18n";
import { useAppStore, type TriageMessage } from "@/lib/store";
import { useT } from "@/lib/useT";

function EmptyState() {
  const { t } = useT();
  return (
    <p className="rounded-lg border border-dashed border-border-control bg-surface p-4 text-body text-text-secondary">
      {t("triage.intro")}
    </p>
  );
}

function ErrorBubble({ message }: { message: Extract<TriageMessage, { kind: "error" }> }) {
  const { t } = useT();
  const retry = useAppStore((s) => s.retryTriage);
  const pending = useAppStore((s) => s.triage.pending);

  return (
    <div role="alert" className="max-w-[92%] rounded-lg rounded-es-md border border-border bg-surface p-3 text-body">
      <p className="flex items-start gap-2 font-medium text-text-primary">
        <TriangleAlert aria-hidden className="text-warning-text" />
        {message.code === "llm_not_configured" ? t("triage.notConfigured") : t("triage.failed")}
      </p>
      <p lang="en" dir="ltr" className="mt-1 text-caption break-words text-text-secondary">
        {message.message}
      </p>
      <p className="mt-2 font-semibold text-critical-text">{t("triage.errorFallback")}</p>
      <button
        type="button"
        onClick={() => void retry()}
        disabled={pending}
        className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-raised px-3 py-1 text-caption font-semibold text-text-primary disabled:opacity-50"
      >
        <RotateCcw aria-hidden />
        {t("triage.retry")}
      </button>
    </div>
  );
}

function Bubble({ message }: { message: TriageMessage }) {
  const { t } = useT();

  if (message.role === "user") {
    return (
      <p
        dir="auto"
        lang={textLang(message.text)}
        className="max-w-[85%] rounded-lg rounded-ee-sm border border-border bg-surface-raised px-4 py-2 text-body whitespace-pre-wrap text-text-primary"
      >
        {message.text}
      </p>
    );
  }
  if (message.kind === "clarification") {
    return (
      <div className="max-w-[85%] rounded-lg rounded-es-md border border-border bg-surface px-4 py-3">
        <p className="text-caption font-semibold text-text-secondary">{t("triage.followUp")}</p>
        <p dir="auto" lang={textLang(message.question)} className="mt-1 text-body text-text-primary">
          {message.question}
        </p>
      </div>
    );
  }
  if (message.kind === "error") return <ErrorBubble message={message} />;
  return <ClassificationCard message={message} />;
}

/** Chat-mode conversation: bubbles, the classification card, and a typing indicator. */
export function ChatThread() {
  const { t } = useT();
  const messages = useAppStore((s) => s.triage.messages);
  const pending = useAppStore((s) => s.triage.pending);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    if (messages.length > 0 || pending) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  if (messages.length === 0 && !pending) return <EmptyState />;

  return (
    <>
      <ol aria-live="polite" className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className={`rise flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Bubble message={message} />
          </li>
        ))}
        {pending && (
          <li className="rise flex justify-start">
            <p className="inline-flex items-center gap-2 rounded-lg rounded-es-md border border-border bg-surface px-4 py-3 text-body text-text-secondary">
              <span aria-hidden className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-1.5 rounded-full bg-text-secondary"
                  />
                ))}
              </span>
              {t("triage.thinking")}
            </p>
          </li>
        )}
      </ol>
      <div ref={endRef} className="scroll-mb-40" />
    </>
  );
}
