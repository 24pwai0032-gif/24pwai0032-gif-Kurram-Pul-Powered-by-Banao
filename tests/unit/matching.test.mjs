// Surplus matching (lib/matching.ts) against the real seed data.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const B = fileURLToPath(new URL("../../", import.meta.url));
const { findMatches } = await import("@/lib/matching");
const { loadSeed } = await import("@/lib/seed");
const { hopsFrom } = await import("@/lib/areas");
const { translateName } = await import("@/lib/i18n");

let fails = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };

const seed = JSON.parse(readFileSync(`${B}data/seed-reports.json`, "utf8"));
const now = Date.now();
const { areas, triageCases } = loadSeed(seed, now);
const describe = (r) => ({
  matches: r.matches.map((m) => `${m.need.supply}: ${m.offers[0].area} -> ${m.need.area} (${m.need.urgency}, d${m.offers[0].distance}${m.need.triageCases ? `, ${m.need.triageCases} triage` : ""}${m.offers.length > 1 ? `, +${m.offers.length - 1} alt` : ""})`),
  unmatched: r.unmatched.map((g) => `${g.supply}: ${g.needs.map((n) => n.area).join(" + ")}`),
});

check("hops: Pewar -> Bagan is 5", hopsFrom("Pewar").get("Bagan") === 5, [...hopsFrom("Pewar")]);

const base = describe(findMatches(areas, triageCases, now));
console.log("   matches:", base.matches);
console.log("   unmatched:", base.unmatched);
check("6 matches, in urgency-then-distance order", JSON.stringify(base.matches) === JSON.stringify([
  "Insulin: Pewar -> Parachinar City Center (critical, d1, 1 triage, +1 alt)",
  "ORS: Sadda -> Bagan (critical, d2)",
  "Antibiotics: Balishkhel -> Parachinar City Center (needs_supplies, d1, +1 alt)",
  "IV fluids: Pewar -> Balishkhel (needs_supplies, d2)",
  "Paracetamol: Parachinar City Center -> Sadda (needs_supplies, d2, +1 alt)",
  "IV fluids: Pewar -> Bagan (needs_supplies, d5)",
]), base.matches);
check("insulin need escalated to critical by the triage case, low-stock need stays needs_supplies", base.matches[0].includes("(critical"), base.matches[0]);
check("unmatched supplies stated, worst and widest first", JSON.stringify(base.unmatched) === JSON.stringify([
  "Oxygen: Parachinar City Center + Alizai",
  "Baby formula: Sadda + Bagan",
  "Surgical supplies: Parachinar City Center",
  "Asthma inhalers: Balishkhel",
]), base.unmatched);

// Live triage cases from Phase 4 feed in.
const live = [
  ...triageCases,
  { id: "live-1", area: "Bagan", urgency_tier: "critical", supply_needed: "oral rehydration salts (ORS)" },
  { id: "live-2", area: "Sadda", urgency_tier: "needs_supplies", supply_needed: "oxygen cylinder" },
  { id: "live-3", area: "Sadda", urgency_tier: "critical", supply_needed: "ORS" },
  { id: "live-4", area: "Bagan", urgency_tier: "needs_supplies", supply_needed: "insulin" },
  { id: "live-5", area: "Alizai", urgency_tier: "routine", supply_needed: "paracetamol" },
];
const withLive = describe(findMatches(areas, live, now));
check("Bagan ORS triage case joins Bagan's ORS need", withLive.matches.includes("ORS: Sadda -> Bagan (critical, d2, 1 triage)"), withLive.matches);
check("Sadda oxygen case joins the Oxygen no-match group", withLive.unmatched[0] === "Oxygen: Parachinar City Center + Alizai + Sadda", withLive.unmatched);
check("Sadda ORS case skipped: Sadda has its own ORS surplus", !withLive.matches.some((m) => m.endsWith("-> Sadda (critical, d1, 1 triage)") && m.startsWith("ORS")), withLive.matches);
check("triage-only need (Bagan insulin) matched to Alizai, next door", withLive.matches.includes("Insulin: Alizai -> Bagan (needs_supplies, d1, 1 triage, +1 alt)"), withLive.matches);
check("routine cases never create needs", !withLive.matches.some((m) => m.includes("-> Alizai")), withLive.matches);

const ids = findMatches(areas, triageCases, now).matches.map((m) => m.id);
check("match ids are unique", new Set(ids).size === ids.length, ids);
const again = findMatches(areas, triageCases, now + 60_000).matches.map((m) => m.id);
check("match ids are stable across clock ticks", JSON.stringify(ids) === JSON.stringify(again));

check("triage wording 'oral rehydration salts (ORS)' shows as canonical 'ORS'", !withLive.matches.some((m) => m.startsWith("oral")), withLive.matches);
check("translateName is case-insensitive", translateName("ur", "supplies", "insulin") === "انسولین" && translateName("ur", "supplies", "Unknown thing") === "Unknown thing");
check("translateName ignores prototype keys", translateName("en", "supplies", "constructor") === "constructor");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
