"use client";

import { MessageSquareText, ShieldAlert, Smartphone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Always visible on the triage view, in both modes (SPEC section 6). */
export function TriageDisclaimer() {
  const { t } = useT();
  return (
    <p role="note" className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-caption font-medium text-text-secondary">
      <ShieldAlert aria-hidden />
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
      <span className="text-caption font-semibold text-text-secondary">{t("triage.modeLabel")}</span>
      <div role="group" aria-label={t("triage.modeLabel")} className="inline-flex gap-1 rounded-md border border-border bg-surface-raised p-1">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            data-triage-mode={id}
            onClick={() => setMode(id)}
            className={`inline-flex items-center gap-2 rounded-sm px-3 py-2 text-body font-medium transition-colors ${
              mode === id ? "bg-brand text-on-brand" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon aria-hidden />
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
    <label className="flex min-w-52 flex-1 flex-col gap-1 text-caption font-semibold text-text-secondary">
      {t("triage.areaLabel")}
      <select
        value={area ?? ""}
        onChange={(e) => setArea(e.target.value)}
        className="h-10 w-full rounded-md border border-border-control bg-surface px-3 text-body font-medium text-text-primary"
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
