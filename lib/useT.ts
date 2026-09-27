import { useMemo } from "react";
import {
  formatAge,
  formatDate,
  translate,
  type DateStyle,
  translateName,
  type MessageKey,
  type MessageVars,
} from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** Translation helpers bound to the current language. */
export function useT() {
  const locale = useAppStore((s) => s.language);

  return useMemo(
    () => ({
      locale,
      t: (key: MessageKey, vars?: MessageVars) => translate(locale, key, vars),
      tArea: (name: string) => translateName(locale, "areas", name),
      tSupply: (name: string) => translateName(locale, "supplies", name),
      /** Reporters and verifiers ("Community reporter", "Malik Jan"). */
      tName: (name: string) => translateName(locale, "names", name),
      /** Seed forecast signals and past closure causes. */
      tEvent: (text: string) => translateName(locale, "events", text),
      formatAge: (ms: number) => formatAge(locale, ms),
      formatDate: (isoDate: string, style: DateStyle) => formatDate(locale, isoDate, style),
    }),
    [locale],
  );
}
