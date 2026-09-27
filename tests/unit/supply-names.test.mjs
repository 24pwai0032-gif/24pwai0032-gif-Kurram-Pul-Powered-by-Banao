// Supply names: model wording mapped to the reports' names (ORS, IV fluids…).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const B = fileURLToPath(new URL("../../", import.meta.url));
const { sameSupply, canonicalSupply } = await import("@/lib/stock");
const { loadSeed } = await import("@/lib/seed");
const { areas } = loadSeed(JSON.parse(readFileSync(`${B}data/seed-reports.json`, "utf8")), Date.now());
let fails = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };
// Wording seen from gpt-6-luna in the real-key test, plus common variants.
const cases = [
  ["Oral rehydration solution", "ORS"],
  ["His exact prescribed insulin", "Insulin"],
  ["Normal saline drip", "IV fluids"],
  ["Panadol syrup", "Paracetamol"],
  ["Salbutamol inhaler", "Asthma inhalers"],
  ["Amoxicillin", "Antibiotics"],
  ["Infant formula milk", "Baby formula"],
  ["Sterile gauze and sutures", "Surgical supplies"],
  ["Oxygen cylinder", "Oxygen"],
];
for (const [said, expected] of cases) check(`"${said}" -> ${expected}`, canonicalSupply(said, areas) === expected, canonicalSupply(said, areas));
check("no false match: Oxygen vs ORS", !sameSupply("Oxygen", "ORS"));
check("no false match: insulin vs antibiotics", !sameSupply("His exact prescribed insulin", "Antibiotics"));
check("unknown supply keeps its own name", canonicalSupply("Anti-venom", areas) === "Anti-venom");
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
