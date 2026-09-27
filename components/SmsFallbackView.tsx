"use client";

import { isolate } from "@/lib/i18n";
import { findNearbyStock } from "@/lib/stock";
import { useAppStore, type TriageMessage } from "@/lib/store";
import { smsSegments } from "@/lib/triage";
import { useT } from "@/lib/useT";

type AssistantMessage = Exclude<TriageMessage, { role: "user" }>;

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?۔]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Degraded-connectivity triage (SPEC section 6): the same conversation as the chat view,
 * rendered as the plain text an SMS gateway would actually deliver. No bubbles, icons or
 * colors; urgency is carried by words alone, and every reply shows how many SMS it costs.
 */
export function SmsFallbackView() {
  const { t, locale, tArea, tSupply, tName } = useT();
  const messages = useAppStore((s) => s.triage.messages);
  const pending = useAppStore((s) => s.triage.pending);
  const draft = useAppStore((s) => s.triage.draft);
  const setDraft = useAppStore((s) => s.setTriageDraft);
  const area = useAppStore((s) => s.triage.area);
  const awaiting = useAppStore((s) => s.triage.awaiting);
  const send = useAppStore((s) => s.sendTriageMessage);
  const areas = useAppStore((s) => s.areas);
  const now = useAppStore((s) => s.now);

  // In Urdu/Pashto, free text (usually English from the model) is bidi-isolated so it can't
  // scramble the line around it. English SMS stays plain GSM text, so its 160-char count holds.
  const free = (text: string) => (locale === "en" ? text : isolate(text));

  // One field per line: easier to read on a basic phone, and each line is its own bidi paragraph.
  const replyText = (message: AssistantMessage): string => {
    const header = t("sms.header");
    if (message.kind === "clarification") return `${header}\n${t("sms.question")}: ${free(message.question)}`;
    if (message.kind === "error") return `${header}: ${t("sms.error")}\n${t("triage.errorFallback")}`;

    const { result } = message;
    const lines = [`${header}: ${t(`sms.tiers.${result.urgency_tier}`)}`];
    if (result.reason) lines.push(free(sentence(result.reason)));
    if (result.recommended_action) lines.push(`${t("sms.next")}: ${free(sentence(result.recommended_action))}`);
    if (result.supply_needed) {
      lines.push(`${t("sms.need")}: ${free(tSupply(result.supply_needed))}`);
      const [lead] = findNearbyStock(result.supply_needed, message.area, areas, now, 1);
      if (lead) lines.push(`${t("sms.stock")}: ${free(tName(lead.report.reported_by))}, ${tArea(lead.area)}`);
    }
    if (result.urgency_tier === "critical") lines.push(t("sms.edhi"));
    lines.push(`${t("sms.logged")}: ${tArea(message.area)}`, t("sms.disclaimer"));
    return lines.join("\n");
  };

  const canSend = area !== null && !pending && draft.trim().length > 0;
  const { segments } = smsSegments(draft);

  return (
    <div className={`rounded-lg border border-line-strong bg-surface text-sm text-ink ${locale === "en" ? "font-mono" : ""}`}>
      <p className="border-b border-line px-3 py-2 text-xs text-muted">{t("triage.smsNote")}</p>

      {messages.length === 0 && !pending ? (
        <p className="px-3 py-4 text-muted">{t("triage.intro")}</p>
      ) : (
        <ol aria-live="polite" className="divide-y divide-line">
          {messages.map((message) => {
            const text = message.role === "user" ? message.text : replyText(message);
            return (
              <li key={message.id} className="px-3 py-2.5">
                <p className="text-xs text-muted">
                  {message.role === "user" ? `> ${t("triage.you")}` : `< ${t("triage.service")}`} {clock(message.at)}
                  {message.role === "assistant" && ` · ${smsSegments(text).segments} SMS`}
                </p>
                <p dir="auto" className="mt-0.5 break-words whitespace-pre-wrap">
                  {text}
                </p>
              </li>
            );
          })}
          {pending && <li className="px-3 py-2.5 text-muted">&lt; …</li>}
        </ol>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) void send(draft);
        }}
        className="border-t border-line p-3"
      >
        <label htmlFor="sms-input" className="sr-only">
          {t("triage.inputLabel")}
        </label>
        <textarea
          id="sms-input"
          rows={3}
          value={draft}
          maxLength={500}
          dir="auto"
          disabled={area === null}
          placeholder={awaiting ? t("triage.answerPlaceholder") : t("triage.inputPlaceholder")}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full resize-none border border-line-strong bg-page px-2 py-1.5 text-sm text-ink placeholder:text-muted disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
          <span>{t("sms.counter", { count: [...draft].length, segments })}</span>
          <button
            type="submit"
            disabled={!canSend}
            className="border border-ink px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
          >
            {t("sms.send")}
          </button>
        </div>
        {area === null && <p className="mt-1.5 text-xs text-muted">{t("triage.areaFirst")}</p>}
      </form>
    </div>
  );
}
