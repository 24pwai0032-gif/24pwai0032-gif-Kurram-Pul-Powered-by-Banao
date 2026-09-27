// Triage: reading the classifier's reply, nearest stock, SMS helpers.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const B = fileURLToPath(new URL("../../", import.meta.url));
const { parseTriageReply } = await import("@/lib/ai/triageReply");
const { findNearbyStock } = await import("@/lib/stock");
const { loadSeed } = await import("@/lib/seed");
const { smsSegments, composeDescription } = await import("@/lib/triage");

let fails = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(got)}`); if (!ok) fails++; };

console.log("--- parseTriageReply");
let r = parseTriageReply('{"urgency_tier":"critical","reason":"High fever in an infant.","recommended_action":"Go to DHQ now.","supply_needed":null}');
check("plain JSON classification", r?.kind === "classification" && r.urgency_tier === "critical" && r.supply_needed === null, r);
r = parseTriageReply('```json\n{"urgency_tier":"Needs Medicine / Supplies","reason":"r","recommended_action":"a","supply_needed":"none"}\n```');
check("fenced JSON, spec tier wording, supply 'none'", r?.kind === "classification" && r.urgency_tier === "needs_supplies" && r.supply_needed === null, r);
r = parseTriageReply('{"urgency_tier":"Critical / Evacuate","reason":"r","recommended_action":"a","supply_needed":["Oxygen","IV fluids"]}');
check("'Critical / Evacuate' + array supply", r?.urgency_tier === "critical" && r.supply_needed === "Oxygen, IV fluids", r);
r = parseTriageReply('{"clarifying_question":"How old is the child, and is the child drinking?"}');
check("clarifying_question key", r?.kind === "clarification" && r.question.startsWith("How old"), r);
r = parseTriageReply('{"question":"Is the patient breathing normally?"}');
check("question key", r?.kind === "clarification", r);
r = parseTriageReply('{"urgency_tier":null,"reason":null,"clarifying_question":"Any bleeding?"}');
check("null tier + question", r?.kind === "clarification" && r.question === "Any bleeding?", r);
r = parseTriageReply("How old is the patient?");
check("plain-text question (no JSON)", r?.kind === "clarification", r);
r = parseTriageReply("I cannot help with that.");
check("prose without a question -> null", r === null, r);
r = parseTriageReply('{"urgency_tier":"high","reason":"r"}');
check("unknown tier, no question -> null", r === null, r);
r = parseTriageReply('Here you go: {"urgency_tier":"routine","reason":"Mild cold.","recommended_action":"Rest and fluids.","supply_needed":"N/A","follow_up_question":"Any fever?"} Hope that helps.');
check("JSON inside prose + follow-up + 'N/A'", r?.urgency_tier === "routine" && r.supply_needed === null && r.follow_up_question === "Any fever?", r);

console.log("--- findNearbyStock (seed data)");
const seed = JSON.parse(readFileSync(`${B}data/seed-reports.json`, "utf8"));
const now = Date.now();
const { areas } = loadSeed(seed, now);
const top = (supply, from) => findNearbyStock(supply, from, areas, now).map((l) => `${l.report.reported_by} @ ${l.area} (${l.report.status}, d${l.distance}${l.stale ? ", stale" : ""})`);
let s = top("Insulin", "Parachinar City Center");
check("insulin for Parachinar -> Pewar's health unit next door, Alizai further down the road", s[0]?.startsWith("Pewar Basic Health Unit @ Pewar (surplus, d1") && s[1]?.startsWith("Alizai Pharmacy @ Alizai (surplus, d3"), s); console.log("       ", s);
s = top("oral rehydration salts (ORS)", "Bagan");
check("ORS for Bagan -> Sadda Medical Store, two areas up the road", s[0]?.startsWith("Sadda Medical Store @ Sadda (surplus, d2"), s); console.log("       ", s);
s = top("antibiotics", "Parachinar City Center");
check("antibiotics: nearest first (Balishkhel, next door), then Alizai", s[0]?.includes("@ Balishkhel (surplus, d1") && s[1]?.includes("@ Alizai (stable, d3"), s); console.log("       ", s);
s = top("Oxygen cylinder", "Parachinar City Center");
check("oxygen: nobody has spare -> none", s.length === 0, s);
s = top("salbutamol inhaler", "Balishkhel");
check("inhaler: nobody has spare -> none", s.length === 0, s);

console.log("--- SMS helpers");
check("short Latin text = 1 SMS of 160", JSON.stringify(smsSegments("fever 2yo")) === JSON.stringify({ segments: 1, perSegment: 160, unicode: false }), smsSegments("fever 2yo"));
check("161 Latin chars = 2 SMS", smsSegments("a".repeat(161)).segments === 2, smsSegments("a".repeat(161)));
check("71 Urdu chars = 2 SMS (UCS-2, 70 each)", smsSegments("ب".repeat(71)).segments === 2 && smsSegments("ب".repeat(71)).unicode, smsSegments("ب".repeat(71)));
check("composeDescription folds in the answer", composeDescription("fever", "How old?", "2 years") === "fever\n\nFollow-up question: How old?\nAnswer: 2 years");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
