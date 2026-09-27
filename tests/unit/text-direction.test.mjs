// Forecast text clean-up, text direction and Urdu/Pashto supply names.
const { withoutRiskLevelLine, parseRiskLevel } = await import("@/lib/forecast");
const { textDir } = await import("@/lib/i18n");
const { sameSupply } = await import("@/lib/stock");
let fails = 0;
const check = (n, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };
const real = "**Risk level: Elevated**\n\n**Why:** The six historical closures lasted 10–75 days.";
check("strips '**Risk level: Elevated**' (real model format)", withoutRiskLevelLine(real).startsWith("**Why:**") && parseRiskLevel(real) === "elevated", withoutRiskLevelLine(real));
check("strips 'risk_level: elevated' before Urdu text", withoutRiskLevelLine("risk_level: elevated\n\n**وضاحت:** متن") === "**وضاحت:** متن");
check("strips a two-line '## Risk level' / 'HIGH'", withoutRiskLevelLine("## Risk level\nHIGH\n\nReason.") === "Reason.", withoutRiskLevelLine("## Risk level\nHIGH\n\nReason."));
check("leaves other mentions of risk alone", withoutRiskLevelLine("The risk is rising.") === "The risk is rising.");
check("textDir: Urdu block with a leading English line → rtl", textDir("risk_level: elevated\n\nصدہ کے قریب کشیدگی اور ایندھن کے قافلے کی روک تھام") === "rtl");
check("textDir: English → ltr", textDir("Parachinar has the strongest signal.") === "ltr");
check("sameSupply: Pashto/Urdu انسولین = Insulin", sameSupply("انسولین", "Insulin") && sameSupply("Insulin", "انسولین"));
check("sameSupply: Urdu آکسیجن = Oxygen, not ORS", sameSupply("آکسیجن", "Oxygen") && !sameSupply("آکسیجن", "ORS"));
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
