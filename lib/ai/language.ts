import type { Locale } from "@/lib/i18n";

const LANGUAGE_NAMES: Record<Exclude<Locale, "en">, string> = {
  ur: "Urdu (اردو)",
  ps: "Pashto (پښتو)",
};

/**
 * The spec prompt, plus one line asking for the answer in the reader's language.
 * English requests get the spec prompt unchanged. `keepInEnglish` names the parts the app
 * reads programmatically (enum values, JSON keys), which must stay in English.
 */
export function withLanguage(systemPrompt: string, locale: Locale | undefined, keepInEnglish?: string): string {
  if (locale === undefined || locale === "en") return systemPrompt;
  const instruction = [
    `Write your entire response in ${LANGUAGE_NAMES[locale]}, in its own script, with Western digits (0-9).`,
    keepInEnglish,
  ]
    .filter(Boolean)
    .join(" ");
  return `${systemPrompt}\n\n${instruction}`;
}

export const TRIAGE_KEEP_IN_ENGLISH =
  "Keep the JSON keys, the urgency_tier value and supply_needed in English (supply_needed as the common English name of the medicine or supply, so it can be matched against stock reports); write reason, recommended_action and any question in the requested language.";

export const FORECAST_KEEP_IN_ENGLISH =
  'Keep the risk level line in English exactly as "risk_level: low", "risk_level: elevated" or "risk_level: high", so software can read it; write everything else in the requested language.';
