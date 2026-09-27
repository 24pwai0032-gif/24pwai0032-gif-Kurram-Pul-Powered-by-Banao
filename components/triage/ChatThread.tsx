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
    <p className="rounded-2xl border border-dashed border-line-strong bg-surface p-4 text-sm text-ink-2">
      {t("triage.intro")}
    </p>
  );
}

function ErrorBubble({ message }: { message: Extract<TriageMessage, { kind: "error" }> }) {
  const { t } = useT();
  const retry = useAppStore((s) => s.retryTriage);
  const pending = useAppStore((s) => s.triage.pending);

  return (
    <div role="alert" className="max-w-[92%] rounded-2xl rounded-es-md border border-line bg-surface p-3 text-sm">
      <p className="flex items-start gap-2 font-medium text-ink">
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" style={{ color: "var(--low)" }} />
        {message.code === "llm_not_configured" ? t("triage.notConfigured") : t("triage.failed")}
      </p>
      <p lang="en" dir="ltr" className="mt-1 text-xs break-words text-muted">
        {message.message}
      </p>
      <p className="mt-2 font-semibold text-critical-ink">{t("triage.errorFallback")}</p>
      <button
        type="button"
        onClick={() => void retry()}
        disabled={pending}
        className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
      >
        <RotateCcw aria-hidden className="size-3.5" />
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
        className="max-w-[85%] rounded-2xl rounded-ee-md bg-ink px-3.5 py-2 text-sm whitespace-pre-wrap text-surface"
      >
        {message.text}
      </p>
    );
  }
  if (message.kind === "clarification") {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-es-md border border-line bg-surface px-3.5 py-2.5">
        <p className="text-xs font-semibold text-muted">{t("triage.followUp")}</p>
        <p dir="auto" lang={textLang(message.question)} className="mt-0.5 text-sm text-ink">
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
    if (messages.length > 0 || pending) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  if (messages.length === 0 && !pending) return <EmptyState />;

  return (
    <>
      <ol aria-live="polite" className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Bubble message={message} />
          </li>
        ))}
        {pending && (
          <li className="flex justify-start">
            <p className="inline-flex items-center gap-2 rounded-2xl rounded-es-md border border-line bg-surface px-3.5 py-2.5 text-sm text-muted">
              <span aria-hidden className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-1.5 rounded-full bg-muted motion-safe:animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
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
