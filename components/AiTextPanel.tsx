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
      <p className="text-caption text-text-secondary">{label}</p>
      <div aria-hidden className="mt-3 space-y-2">
        <div className="h-3 w-11/12 rounded-sm bg-surface-raised" />
        <div className="h-3 w-full rounded-sm bg-surface-raised" />
        <div className="h-3 w-4/5 rounded-sm bg-surface-raised" />
        <div className="h-3 w-2/3 rounded-sm bg-surface-raised" />
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
    <section aria-labelledby={headingId} aria-busy={busy} className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-body font-semibold text-text-primary">
          <Sparkles aria-hidden className="text-text-secondary" />
          {title}
        </h2>
        {!busy && (
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              void onRequest();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-caption font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary"
          >
            <RefreshCw aria-hidden />
            {state.status === "error" ? t("ai.retry") : t("ai.refresh")}
          </button>
        )}
      </div>

      {busy && <Skeleton label={labels.loading} />}

      {state.status === "error" && (
        <div role="alert" className="mt-3 rounded-md bg-surface-raised p-3">
          <p className="flex items-start gap-2 text-body font-medium text-text-primary">
            <TriangleAlert aria-hidden className="text-warning-text" />
            {state.code === "llm_not_configured" ? labels.notConfigured : labels.failed}
          </p>
          <p lang="en" dir="ltr" className="mt-1 text-caption break-words text-text-secondary">
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
              className={`text-body text-text-secondary ${collapsed ? "max-h-64 overflow-hidden" : ""}`}
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
              className="mt-2 text-caption font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              {expanded ? t("ai.showLess") : t("ai.showMore")}
            </button>
          )}
          {labels.outdated && state.dataVersion !== dataVersion && (
            <p className="mt-3 rounded-md bg-warning-tint px-3 py-2 text-caption font-medium text-warning-text">{labels.outdated}</p>
          )}
          <div className="mt-3 space-y-1 border-t border-border pt-2 text-caption text-text-secondary">
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
