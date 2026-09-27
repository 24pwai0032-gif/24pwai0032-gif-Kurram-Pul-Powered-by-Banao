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
 * Trust signal on a report, as a quiet line of text rather than a chip: a green shield and the
 * elder, facility or coordinator who vouched for it, or a grey "Unverified".
 */
export function VerificationTag({ label }: VerificationTagProps) {
  const { t, tName } = useT();
  const tag = useAppStore((s) =>
    label === null ? undefined : s.verificationTags.find((tag) => tag.label === label),
  );

  if (label === null) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-caption text-text-secondary">
        <ShieldQuestion aria-hidden className="text-text-muted" />
        {t("verification.unverified")}
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 text-caption font-medium text-text-primary">
      <ShieldCheck aria-hidden className="text-brand" />
      <span className="truncate">
        {tag ? `${t(`verification.types.${tag.type}`)} · ${isolate(tName(tag.name))}` : label}
      </span>
    </span>
  );
}
