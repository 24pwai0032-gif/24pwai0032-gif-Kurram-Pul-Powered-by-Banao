import { reportWithAge } from "@/lib/ai/reportData";
import type { SeedReports } from "@/lib/schemas";
import { STALE_AFTER_HOURS } from "@/lib/staleness";

/**
 * Aggregation engine prompt, verbatim from SPEC.md section 7.
 * Used only by app/api/aggregate/route.ts (server-side).
 */
export const AGGREGATION_PROMPT = `You are a logistics summarizer for humanitarian responders in Kurram
district, Pakistan, during a road closure crisis where verification and
timeliness of reports both matter. Given a list of supply reports (each
with a status, a reporter, an optional verification tag, and a timestamp)
and triaged medical cases, produce:

1. A ranked list of the 3 most urgent needs (area, supply, severity),
   noting whether each is verified or unverified
2. A one-paragraph summary in plain language for a responder who has
   30 seconds to read it, flagging any area with stale (no recent update)
   reports as a possible blind spot
3. A suggested order in which areas should receive relief first, with
   one-line reasoning for each

This data reflects simulated reports illustrating how the system would
function with real reporting in place. Treat it as representative, not
as a verified real-world finding.

Data: {json_data}

Respond in clear, structured text, not JSON.`;

const DATA_LINE = "Data: {json_data}";
const [instructionsBefore, instructionsAfter] = AGGREGATION_PROMPT.split(DATA_LINE);

/**
 * The spec prompt minus its "Data:" line. The data goes in the user message instead,
 * so free text inside a report can't pose as an instruction.
 */
export const AGGREGATION_SYSTEM_PROMPT = `${instructionsBefore.trim()}\n\n${instructionsAfter.trim()}`;

/**
 * The user message: the reports and triage cases, plus the current time and each
 * report's age, so the model can spot stale reports without doing date arithmetic.
 */
export function buildAggregationInput(data: SeedReports, now: number): string {
  const payload = {
    current_time: new Date(now).toISOString(),
    stale_after_hours: STALE_AFTER_HOURS,
    areas: data.areas.map((area) => ({
      name: area.name,
      reports: area.reports.map((report) => reportWithAge(report, now)),
    })),
    triage_cases_logged: data.triage_cases_logged,
  };
  return `Data: ${JSON.stringify(payload, null, 2)}`;
}
