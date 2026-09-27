import type { UrgencyTier } from "@/lib/schemas";

/** What /api/triage returns: a classification, or the one clarifying question the spec allows. */
export interface TriageClassification {
  kind: "classification";
  urgency_tier: UrgencyTier;
  reason: string;
  recommended_action: string;
  supply_needed: string | null;
  /** Some models add a follow-up question even when they classify; shown if present. */
  follow_up_question: string | null;
}

export interface TriageClarification {
  kind: "clarification";
  question: string;
}

export type TriageReply = TriageClassification | TriageClarification;

/** Longest description sent to the classifier, including any follow-up answers. */
export const MAX_DESCRIPTION_CHARS = 2000;

/**
 * Folds the answer to a clarifying question into the description, so the classifier
 * (which sees one message at a time) gets the whole story.
 */
export function composeDescription(previous: string, question: string, answer: string): string {
  return `${previous}\n\nFollow-up question: ${question}\nAnswer: ${answer}`;
}

// ---------- SMS simulation ----------

/** GSM-7 fits 160 characters per SMS; anything outside it (Urdu, Pashto, emoji) forces UCS-2 at 70. */
const GSM_7 = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;

export function smsSegments(text: string): { segments: number; perSegment: number; unicode: boolean } {
  const unicode = !GSM_7.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153; // multi-part SMS lose a few characters to the joining header
  const length = [...text].length;
  const segments = length <= single ? 1 : Math.ceil(length / multi);
  return { segments, perSegment: length <= single ? single : multi, unicode };
}
