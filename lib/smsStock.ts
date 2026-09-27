import { LOCALES, translateName } from "@/lib/i18n";
import type { SupplyStatus } from "@/lib/schemas";
import { sameSupply } from "@/lib/stock";

/**
 * Stock reports by SMS, for when mobile data is cut: "STOCK Pewar Insulin surplus" from any
 * phone. Parsed on our side with no model call, so it works over a plain SMS gateway. Area and
 * supply may be written in English or Roman Urdu, or in Urdu or Pashto script; the words can
 * come in any order after STOCK.
 */
export type StockSms =
  | { ok: true; area: string; supply: string; status: SupplyStatus }
  | { ok: false; missing: "keyword" | "area" | "supply" | "status" };

export const STOCK_SMS_EXAMPLE = "STOCK Pewar Insulin surplus";

/** Words for each stock level, as people text them: English, Roman Urdu, Urdu and Pashto. */
const LEVEL_WORDS: Record<SupplyStatus, string[]> = {
  critical: ["critical", "out", "finished", "none", "khatam", "khtm", "ختم", "نازک", "شدید", "سخت", "نشته"],
  low: ["low", "kam", "short", "کم", "لږ"],
  stable: ["ok", "okay", "stable", "normal", "enough", "theek", "thik", "ٹھیک", "مستحکم", "کافی", "ثابت", "سم"],
  surplus: ["surplus", "spare", "extra", "zaid", "zyada", "ziada", "اضافی", "اضافي", "زیات", "زیاد"],
};

const words = (text: string) => text.toLowerCase().split(/[\s,.;:!?،۔؛()]+/).filter(Boolean);

/** Every way an area can be written: "Parachinar City Center", "parachinar", "پاراچنار شہر", "پاراچنار". */
function areaAliases(name: string): string[] {
  const names = LOCALES.map((l) => translateName(l, "areas", name).toLowerCase());
  return [...new Set(names.flatMap((n) => [n, n.split(" ")[0]]))];
}

export function parseStockSms(text: string, areaNames: string[], supplies: string[]): StockSms {
  const tokens = words(text);
  if (!["stock", "stk", "اسٹاک", "سٹاک", "ذخیره"].includes(tokens[0] ?? "")) return { ok: false, missing: "keyword" };
  const rest = tokens.slice(1);
  const body = ` ${rest.join(" ")} `;
  const has = (alias: string) => body.includes(` ${alias} `);

  const area = areaNames.find((name) => areaAliases(name).some(has));
  // An English or Roman word matches through the supply synonyms ("panadol", "drip"); a
  // name in Urdu or Pashto script matches its translation.
  const supply = supplies.find(
    (s) => rest.some((w) => /[a-z]/.test(w) && sameSupply(w, s)) || LOCALES.some((l) => has(translateName(l, "supplies", s).toLowerCase())),
  );
  const status = (Object.keys(LEVEL_WORDS) as SupplyStatus[]).find((level) => LEVEL_WORDS[level].some((w) => rest.includes(w)));

  if (!area) return { ok: false, missing: "area" };
  if (!supply) return { ok: false, missing: "supply" };
  if (!status) return { ok: false, missing: "status" };
  return { ok: true, area, supply, status };
}
