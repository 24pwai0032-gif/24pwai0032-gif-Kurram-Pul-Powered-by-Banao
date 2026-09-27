// Forecast: reading the risk level, closure statistics, the verbatim spec prompt.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const B = fileURLToPath(new URL("../../", import.meta.url));
const { parseRiskLevel, closureStats } = await import("@/lib/forecast");
const { FORECASTER_SYSTEM_PROMPT, buildForecasterInput } = await import("@/lib/ai/forecasterPrompt");
let fails = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };
const cases = [
  ["risk_level: elevated", "elevated"],
  ["**Risk level:** Elevated\n\nExplanation...", "elevated"],
  ["## Risk level\nHIGH", "high"],
  ["1. risk_level: \"low\"", "low"],
  ["The risk level is elevated because...", "elevated"],
  ["Overall: Elevated risk of a new closure.", "elevated"],
  ["This is a high-risk period.", "high"],
  ["No level stated here.", null],
];
for (const [text, want] of cases) check(`parse ${JSON.stringify(text.slice(0, 32))} -> ${want}`, parseRiskLevel(text) === want, parseRiskLevel(text));
const history = JSON.parse(readFileSync(`${B}data/closure-history.json`, "utf8"));
const stats = closureStats(history.past_closures);
check("stats: 6 closures, median 15.5, longest 84", stats.count === 6 && stats.medianDays === 15.5 && stats.longestDays === 84, stats);
const spec = readFileSync(`${B}SPEC.md`, "utf8").split("### Forecaster Prompt")[1].split("```")[1].trim();
check("system prompt = SPEC forecaster prompt minus its two data lines", FORECASTER_SYSTEM_PROMPT === spec.replace("Historical closures: {closure_history}\nCurrent signals: {current_signals}\n\n", ""));
const input = buildForecasterInput(history, new Date("2026-09-27T08:00:00Z"));
check("input: date line + the spec's two data lines", input.startsWith("Today's date: 2026-09-27\nHistorical closures: [") && input.includes("\nCurrent signals: ["), input.slice(0, 80));
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
