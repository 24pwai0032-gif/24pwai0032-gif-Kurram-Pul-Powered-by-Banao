// "No supply" in the many ways real models write it → null; real supply names → kept.
import { parseTriageReply } from "@/lib/ai/triageReply";

let fails = 0;
const supply = (v) =>
  parseTriageReply(JSON.stringify({ urgency_tier: "critical", reason: "r", recommended_action: "a", supply_needed: v }))?.supply_needed;
const cases = [
  // The reported bug, verbatim.
  ["None specified; urgent medical assessment is needed.", null],
  ["None—urgent medical assessment is needed.", null],
  ["None", null], ["none.", null], ["None (refer to DHQ)", null], ["None needed", null], ["None required.", null],
  ["None identified", null], ["None of the listed supplies", null],
  ["Not specified", null], ["Not applicable at this stage", null], ["Not needed", null], ["Unspecified", null], ["Unknown", null],
  ["No specific supply", null], ["No supply needed", null], ["No medication required", null], ["No", null], ["No.", null],
  ["Nothing specific", null], ["Nil", null], ["N/A - refer", null], ["n/a", null], ["--", null], [null, null], ["", null],
  // Real supplies, including ones that start with the same letters.
  ["Insulin", "Insulin"], ["Oxygen - urgent", "Oxygen - urgent"], ["Nebulizer", "Nebulizer"], ["Noradrenaline", "Noradrenaline"],
  ["Nutrition supplements", "Nutrition supplements"], ["No insulin at home", "No insulin at home"], ["ORS", "ORS"],
  ["Antibiotics (amoxicillin)", "Antibiotics (amoxicillin)"], ["Unani herbal remedy", "Unani herbal remedy"],
];
for (const [input, want] of cases) {
  const got = supply(input);
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} -> ${JSON.stringify(got)}`);
}
console.log(fails ? `${fails} FAILED` : "ALL PASSED");
process.exit(fails ? 1 : 0);
