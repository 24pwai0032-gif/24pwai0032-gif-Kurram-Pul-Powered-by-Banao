/**
 * The guided tour: the SPEC's one scenario, end to end, in four steps a judge can click through
 * in a minute. A critical case comes in through triage, appears on the dashboard, finds spare
 * stock next door, and the forecaster shows what to prepare for. Each step does the real thing
 * (the triage step sends a real case), so nothing is staged.
 */
export const TOUR_STEPS = ["triage", "dashboard", "matcher", "forecast", "done"] as const;
export type TourStep = (typeof TOUR_STEPS)[number];

/** Steps shown as "Step n of 4"; the closing card isn't counted. */
export const TOUR_COUNTED = TOUR_STEPS.length - 1;

/** Where the tour's case is logged, and the match it leads to (Alizai's spare insulin). */
export const TOUR_AREA = "Parachinar City Center";
export const TOUR_MATCH_SUPPLY = "Insulin";
