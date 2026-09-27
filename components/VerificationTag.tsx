"use client";

import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { isolate } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

interface VerificationTagProps {
  /** A report's verified_by label, or null when nobody has vouched for it. */
  label: string | null;
}

/**
 * Trust signal on a report. Verified reports get a solid chip naming the elder,
 * facility or coordinator who vouched for them; unverified ones get a dashed outline.
 */
export function VerificationTag({ label }: VerificationTagProps) {
  const { t, tName } = useT();
  const tag = useAppStore((s) =>
    label === null ? undefined : s.verificationTags.find((tag) => tag.label === label),
  );

  if (label === null) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-line-strong px-2 py-0.5 text-xs text-muted">
        <ShieldQuestion aria-hidden className="size-3.5" />
        {t("verification.unverified")}
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink">
      <ShieldCheck aria-hidden className="size-3.5 shrink-0" strokeWidth={2.25} />
      <span className="truncate">
        {tag ? `${t(`verification.types.${tag.type}`)} · ${isolate(tName(tag.name))}` : label}
      </span>
    </span>
  );
}
