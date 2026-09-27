import en from "@/messages/en.json";
import ps from "@/messages/ps.json";
import ur from "@/messages/ur.json";
import { HOUR_MS, MINUTE_MS } from "@/lib/staleness";

export const LOCALES = ["en", "ur", "ps"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Carries the chosen language so the server renders the right lang/dir on reload. */
export const LOCALE_COOKIE = "kp-locale";

/** Each language's name in its own script, for the language toggle. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
  ps: "پښتو",
};

type Messages = typeof en;

// Urdu and Pashto are checked against the English shape: a missing key is a type error.
const MESSAGES: Record<Locale, Messages> = { en, ur, ps };

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type MessageKey = LeafPaths<Messages>;
export type MessageVars = Record<string, string | number>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "en" ? "ltr" : "rtl";
}

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, part)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Wraps text in Unicode bidi isolation marks (FSI ... PDI), so an English name or a
 * number inside an Urdu/Pashto sentence can't reorder the words around it.
 */
export function isolate(text: string | number): string {
  return `⁨${text}⁩`;
}

/**
 * "en" for text with no Arabic-script letters, else undefined. Model output is often
 * English even in the Urdu/Pashto UI; tagging it lets it use the Latin font.
 */
export function textLang(text: string): "en" | undefined {
  return /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(text) ? undefined : "en";
}

/** "rtl" when most letters are Arabic-script (Urdu, Pashto), else "ltr". */
export function textDir(text: string): "ltr" | "rtl" {
  const rtl = text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g)?.length ?? 0;
  const ltr = text.match(/[A-Za-z]/g)?.length ?? 0;
  return rtl > ltr ? "rtl" : "ltr";
}

function interpolate(text: string, vars?: MessageVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? isolate(vars[name]) : match,
  );
}

export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const text = lookup(MESSAGES[locale], key) ?? lookup(MESSAGES.en, key) ?? key;
  return interpolate(text, vars);
}

/**
 * Translates a data value (an area, supply, reporter or verifier name, or a seed signal or
 * closure cause), falling back to the value itself for anything new.
 * Case-insensitive, since model output says "insulin" where the reports say "Insulin".
 */
export function translateName(locale: Locale, group: "areas" | "supplies" | "names" | "events", name: string): string {
  const names: Record<string, string> = MESSAGES[locale][group];
  if (Object.hasOwn(names, name)) return names[name];
  const key = Object.keys(names).find((k) => k.toLowerCase() === name.trim().toLowerCase());
  return key === undefined ? name : names[key];
}

const MONTH_KEYS = [
  "months.m1", "months.m2", "months.m3", "months.m4", "months.m5", "months.m6",
  "months.m7", "months.m8", "months.m9", "months.m10", "months.m11", "months.m12",
] as const satisfies readonly MessageKey[];

/**
 * "Oct 2024" / "25 Sep" from an ISO date, with month names from messages/ rather than Intl:
 * browsers ship no Pashto date data and silently fall back to English.
 */
export type DateStyle = "monthYear" | "dayMonth" | "full";

export function formatDate(locale: Locale, isoDate: string, style: DateStyle): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const monthName = translate(locale, MONTH_KEYS[month - 1]);
  if (style === "monthYear") return translate(locale, "time.monthYear", { month: monthName, year });
  if (style === "dayMonth") return translate(locale, "time.dayMonth", { day, month: monthName });
  return translate(locale, "time.dayMonthYear", { day, month: monthName, year });
}

/**
 * The English supply name for an Urdu or Pashto one ("انسولین" → "Insulin"), via the
 * translations in messages/. For model output that names a supply in the reader's language.
 */
export function supplyFromLocalName(name: string): string | undefined {
  const wanted = name.trim();
  for (const locale of ["ur", "ps"] as const) {
    const names: Record<string, string> = MESSAGES[locale].supplies;
    for (const [english, local] of Object.entries(names)) {
      if (wanted === local || wanted.includes(local)) return english;
    }
  }
  return undefined;
}

export function formatAge(locale: Locale, ms: number): string {
  if (ms < MINUTE_MS) return translate(locale, "time.justNow");
  if (ms < HOUR_MS) return translate(locale, "time.minutesAgo", { count: Math.floor(ms / MINUTE_MS) });
  const hours = Math.floor(ms / HOUR_MS);
  if (hours < 48) return translate(locale, "time.hoursAgo", { count: hours });
  return translate(locale, "time.daysAgo", { count: Math.floor(hours / 24) });
}
