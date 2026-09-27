"use client";

import { MessageSquareText, ShieldAlert, Smartphone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Always visible on the triage view, in both modes (SPEC section 6). */
export function TriageDisclaimer() {
  const { t } = useT();
  return (
    <p role="note" className="flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-2">
      <ShieldAlert aria-hidden className="mt-px size-4 shrink-0" />
      {t("triage.disclaimer")}
    </p>
  );
}

/** Chat (full connectivity) or SMS (degraded connectivity): the same conversation, two renderings. */
export function ModeToggle() {
  const { t } = useT();
  const mode = useAppStore((s) => s.triage.mode);
  const setMode = useAppStore((s) => s.setTriageMode);

  const options = [
    { id: "chat", label: t("triage.modeChat"), icon: MessageSquareText },
    { id: "sms", label: t("triage.modeSms"), icon: Smartphone },
  ] as const;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{t("triage.modeLabel")}</span>
      <div role="group" aria-label={t("triage.modeLabel")} className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            data-triage-mode={id}
            onClick={() => setMode(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === id ? "bg-ink text-surface" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Which area the case is logged against on the dashboard. */
export function AreaPicker() {
  const { t, tArea } = useT();
  const areas = useAppStore((s) => s.areas);
  const area = useAppStore((s) => s.triage.area);
  const setArea = useAppStore((s) => s.setTriageArea);

  return (
    <label className="flex min-w-52 flex-1 flex-col gap-1 text-xs font-semibold text-muted">
      {t("triage.areaLabel")}
      <select
        value={area ?? ""}
        onChange={(e) => setArea(e.target.value)}
        className="h-10 w-full rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink"
      >
        <option value="" disabled>
          {t("triage.areaPlaceholder")}
        </option>
        {areas.map(({ name }) => (
          <option key={name} value={name}>
            {tArea(name)}
          </option>
        ))}
      </select>
    </label>
  );
}
