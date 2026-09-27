import { neighboursOf } from "@/lib/areas";
import { reportWithAge } from "@/lib/ai/reportData";
import type { SeedReports } from "@/lib/schemas";
import { STALE_AFTER_HOURS } from "@/lib/staleness";

/**
 * Surplus matching prompt, verbatim from SPEC.md section 8.
 * Used only by app/api/surplus-match/route.ts (server-side).
 */
export const SURPLUS_MATCH_PROMPT = `You are a resource-matching assistant for Kurram district, Pakistan, during
a supply crisis where movement between areas is difficult but not always
impossible for local, short-distance transport.

Given a list of supply reports across named areas, each tagged with a
status (critical, low, stable, surplus) and a supply type, identify pairs
where one area's surplus could address another area's critical or
needs_supplies gap for the same supply type.

For each match, output:
1. From area, to area, and supply type
2. Urgency of the receiving area's need
3. A one-line rationale a coordinator could act on immediately
   (e.g., "Alizai has surplus insulin and is a short distance from
   Parachinar City Center, which has a critical insulin shortage")

If no matches exist for a given supply type, state that clearly rather
than forcing a weak match.

Data: {json_data}

Respond in clear, structured text.`;

const DATA_LINE = "Data: {json_data}";
const [instructionsBefore, instructionsAfter] = SURPLUS_MATCH_PROMPT.split(DATA_LINE);

/** The spec prompt minus its "Data:" line; the data goes in the user message instead. */
export const SURPLUS_MATCH_SYSTEM_PROMPT = `${instructionsBefore.trim()}\n\n${instructionsAfter.trim()}`;

/**
 * The user message: reports (with age and stale flag), each area's directly neighbouring
 * areas so the model can judge "a short distance", and triage cases, whose
 * needs_supplies tier is the "needs_supplies gap" the prompt refers to.
 */
export function buildSurplusMatchInput(data: SeedReports, now: number): string {
  const payload = {
    current_time: new Date(now).toISOString(),
    stale_after_hours: STALE_AFTER_HOURS,
    areas: data.areas.map((area) => ({
      name: area.name,
      nearby_areas: neighboursOf(area.name),
      reports: area.reports.map((report) => reportWithAge(report, now)),
    })),
    triage_cases_logged: data.triage_cases_logged,
  };
  return `Data: ${JSON.stringify(payload, null, 2)}`;
}
