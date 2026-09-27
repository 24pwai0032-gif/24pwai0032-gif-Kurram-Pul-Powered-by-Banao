// Stock reports by SMS (lib/smsStock.ts): "STOCK <area> <supply> <level>" in any of the three languages.
const { parseStockSms } = await import("@/lib/smsStock");

let fails = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };

const AREAS = ["Parachinar City Center", "Pewar", "Alizai", "Balishkhel", "Sadda", "Bagan"];
const SUPPLIES = ["Insulin", "Oxygen", "Surgical supplies", "Antibiotics", "Paracetamol", "IV fluids", "Asthma inhalers", "Baby formula", "ORS"];
const parse = (text) => parseStockSms(text, AREAS, SUPPLIES);
const same = (text, want) => { const got = parse(text); check(`"${text}"`, JSON.stringify(got) === JSON.stringify(want), got); };

same("STOCK Pewar Insulin surplus", { ok: true, area: "Pewar", supply: "Insulin", status: "surplus" });
same("stock parachinar oxygen khatam", { ok: true, area: "Parachinar City Center", supply: "Oxygen", status: "critical" });
same("Stock Sadda ORS low.", { ok: true, area: "Sadda", supply: "ORS", status: "low" });
same("STOCK Bagan panadol theek", { ok: true, area: "Bagan", supply: "Paracetamol", status: "stable" });
same("STOCK low antibiotics Balishkhel", { ok: true, area: "Balishkhel", supply: "Antibiotics", status: "low" });
same("STOCK پاراچنار انسولین ختم", { ok: true, area: "Parachinar City Center", supply: "Insulin", status: "critical" });
same("STOCK پېواړ اکسیجن زیات", { ok: true, area: "Pewar", supply: "Oxygen", status: "surplus" });
same("Pewar insulin surplus", { ok: false, missing: "keyword" });
same("STOCK Kabul insulin surplus", { ok: false, missing: "area" });
same("STOCK Pewar bread surplus", { ok: false, missing: "supply" });
same("STOCK Pewar insulin", { ok: false, missing: "status" });

if (fails) { console.log(`\n${fails} FAILED`); process.exit(1); }
console.log("\nALL PASSED");
