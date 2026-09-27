"use client";

import { RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { textDir, textLang } from "@/lib/i18n";
import { ageMs } from "@/lib/staleness";
import { useAppStore, type AiTextState } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Past this length the text starts collapsed, so it doesn't push the page off a phone screen. */
const COLLAPSE_AFTER_CHARS = 700;

interface AiTextPanelProps {
  headingId: string;
  title: string;
  state: AiTextState;
  /** Fetches the text. Called once automatically when the panel first appears, then on Refresh. */
  onRequest: () => Promise<void>;
  /** Adjusts the text for display, e.g. dropping a line the page already shows elsewhere. */
  displayText?: (text: string) => string;
  labels: {
    loading: string;
    notConfigured: string;
    failed: string;
    /** Shown when reports changed after the text was generated. Omit if the text doesn't depend on them. */
    outdated?: string;
  };
}

function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" className="mt-3">
      <p className="text-xs text-muted">{label}</p>
      <div aria-hidden className="mt-2.5 space-y-2 motion-safe:animate-pulse">
        <div className="h-3 w-11/12 rounded bg-surface-2" />
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-4/5 rounded bg-surface-2" />
        <div className="h-3 w-2/3 rounded bg-surface-2" />
      </div>
    </div>
  );
}

/** A panel showing one AI-generated text: loading, error, collapsible result, refresh. */
export function AiTextPanel({ headingId, title, state, onRequest, displayText, labels }: AiTextPanelProps) {
  const { t, locale, formatAge } = useT();
  const now = useAppStore((s) => s.now);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [expanded, setExpanded] = useState(false);

  // Generate on first view, and again when the reader switches language, so the AI text
  // is always in the language of the page around it.
  const staleLanguage = state.status === "ready" && state.language !== locale;
  useEffect(() => {
    if (state.status === "idle" || staleLanguage) void onRequest();
  }, [state.status, staleLanguage, onRequest]);

  const busy = state.status === "idle" || state.status === "loading";
  const text = state.status === "ready" ? (displayText ? displayText(state.text) : state.text) : "";
  const long = state.status === "ready" && text.length > COLLAPSE_AFTER_CHARS;
  const collapsed = long && !expanded;

  return (
    <section aria-labelledby={headingId} aria-busy={busy} className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles aria-hidden className="size-4 text-muted" />
          {title}
        </h2>
        {!busy && (
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              void onRequest();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <RefreshCw aria-hidden className="size-3.5" />
            {state.status === "error" ? t("ai.retry") : t("ai.refresh")}
          </button>
        )}
      </div>

      {busy && <Skeleton label={labels.loading} />}

      {state.status === "error" && (
        <div role="alert" className="mt-3 rounded-lg bg-surface-2 p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-ink">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" style={{ color: "var(--low)" }} />
            {state.code === "llm_not_configured" ? labels.notConfigured : labels.failed}
          </p>
          <p lang="en" dir="ltr" className="mt-1 text-xs break-words text-muted">
            {state.message}
          </p>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <div className="relative mt-2">
            {/* Models usually answer in English even in the Urdu/Pashto UI; keep that block's own language and direction. */}
            <div
              lang={textLang(text)}
              dir={textDir(text)}
              className={`reading text-sm leading-relaxed text-ink-2 ${collapsed ? "max-h-64 overflow-hidden" : ""}`}
            >
              <Markdown>{text}</Markdown>
            </div>
            {collapsed && (
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface" />
            )}
          </div>
          {long && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-semibold text-ink underline underline-offset-2"
            >
              {expanded ? t("ai.showLess") : t("ai.showMore")}
            </button>
          )}
          {labels.outdated && state.dataVersion !== dataVersion && (
            <p className="mt-3 rounded-lg bg-low-bg px-2.5 py-1.5 text-xs font-medium text-low-ink">{labels.outdated}</p>
          )}
          <div className="mt-3 space-y-0.5 border-t border-line pt-2 text-xs text-muted">
            <p>
              {t("ai.generatedBy", {
                model: `${state.provider} ${state.model}`,
                age: formatAge(ageMs(state.generatedAt, now)),
              })}
            </p>
            <p>{t("ai.caution")}</p>
          </div>
        </>
      )}
    </section>
  );
}
