import type { ClosureHistory } from "@/lib/schemas";

/**
 * Closure-risk forecaster prompt, verbatim from SPEC.md section 9.
 * Used only by app/api/forecast/route.ts (server-side).
 */
export const FORECASTER_PROMPT = `You are a risk analyst reviewing patterns of road closures affecting
Parachinar, Kurram district, Pakistan. Given a history of past closures
(dates, durations, and triggers) and a list of current incident signals,
produce:

1. A risk_level: one of ["low", "elevated", "high"]
2. A short explanation grounded in the specific historical pattern and
   current signals provided
3. A concrete recommendation for hospitals and NGOs (for example,
   "pre-stock a 30-day supply of insulin and oxygen given historical
   closure durations averaging X days")

Be explicit that this is a pattern-based estimate, not a prediction of
certainty. Do not overstate confidence.

Historical closures: {closure_history}
Current signals: {current_signals}

Respond in clear, structured text.`;

const DATA_LINES = "Historical closures: {closure_history}\nCurrent signals: {current_signals}";
const [instructionsBefore, instructionsAfter] = FORECASTER_PROMPT.split(DATA_LINES);

/** The spec prompt minus its two data lines; the data goes in the user message instead. */
export const FORECASTER_SYSTEM_PROMPT = `${instructionsBefore.trim()}\n\n${instructionsAfter.trim()}`;

/**
 * The user message: the spec's two data lines, filled in, after today's date so the model
 * can tell how recent the signals are.
 */
export function buildForecasterInput(history: ClosureHistory, today: Date): string {
  return [
    `Today's date: ${today.toISOString().slice(0, 10)}`,
    `Historical closures: ${JSON.stringify(history.past_closures, null, 2)}`,
    `Current signals: ${JSON.stringify(history.current_signals, null, 2)}`,
  ].join("\n");
}
