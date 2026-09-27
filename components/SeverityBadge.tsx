"use client";

import { OctagonAlert } from "lucide-react";
import { CONDITION_TOKEN, type AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

// Dot and word colours per severity token (the dot is the hue, the word its readable tone).
const DOT: Record<string, string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  stable: "bg-stable",
  surplus: "bg-surplus",
  stale: "bg-stale",
};
const WORD: Record<string, string> = {
  critical: "font-bold text-critical-text",
  warning: "text-warning-text",
  stable: "text-stable-text",
  surplus: "text-surplus-text",
  stale: "text-stale-text",
};

interface SeverityBadgeProps {
  status: AreaCondition;
  /** Grays the badge out (for a stale report) but keeps its own label. */
  muted?: boolean;
  /** Dot and word even for critical: for rows inside a card whose header already carries the chip. */
  quiet?: boolean;
}

/**
 * A report's or area's stock level. Only critical is a chip (red, outlined, bold), and only once
 * per card, so it stands out; everything else is a coloured dot and a word, quiet by design. The word
 * is always there, so colour is never the only cue.
 */
export function SeverityBadge({ status, muted = false, quiet = false }: SeverityBadgeProps) {
  const { t } = useT();
  const token = muted ? "stale" : CONDITION_TOKEN[status];

  if (token === "critical" && !quiet) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-critical bg-critical-tint px-2 py-1 text-caption font-bold text-critical-text">
        <OctagonAlert aria-hidden />
        {t(`status.${status}`)}
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 text-caption font-semibold ${WORD[token]}`}>
      <span aria-hidden className={`size-2 rounded-full ${DOT[token]}`} />
      {t(`status.${status}`)}
    </span>
  );
}
