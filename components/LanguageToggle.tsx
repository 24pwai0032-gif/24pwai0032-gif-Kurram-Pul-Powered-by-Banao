"use client";

import { dirFor, LOCALE_NAMES, LOCALES } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Language switch at the foot of the sidebar (on the dark deodar background). */
export function LanguageToggle() {
  const { t } = useT();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <div role="group" aria-label={t("language.label")} className="grid grid-cols-3 rounded-full bg-on-side/10 p-1">
      {LOCALES.map((locale) => {
        const active = locale === language;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            dir={dirFor(locale)}
            aria-pressed={active}
            onClick={() => setLanguage(locale)}
            className={`rounded-full px-2 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-on-side text-side" : "text-on-side-muted hover:text-on-side"
            }`}
          >
            {LOCALE_NAMES[locale]}
          </button>
        );
      })}
    </div>
  );
}
