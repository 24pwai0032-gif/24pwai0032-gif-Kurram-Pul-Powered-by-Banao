"use client";

import { flushSync } from "react-dom";
import { dirFor, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/useT";

/** Language switch at the foot of the sidebar. The current language is marked in the brand clay. */
export function LanguageToggle() {
  const { t } = useT();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  // Switching between left-to-right and right-to-left moves everything on the page, so the
  // change cross-fades (a view transition, timed in globals.css) instead of jumping. The update
  // runs synchronously inside the transition so the new snapshot is the new language.
  const choose = (locale: Locale) => {
    if (locale === language) return;
    const apply = () => flushSync(() => setLanguage(locale));
    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) apply();
    else document.startViewTransition(apply);
  };

  return (
    <div role="group" aria-label={t("language.label")} className="grid grid-cols-3 rounded-full border border-border bg-background p-1">
      {LOCALES.map((locale) => {
        const active = locale === language;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            dir={dirFor(locale)}
            aria-pressed={active}
            onClick={() => choose(locale)}
            className={`rounded-full px-2 py-2 text-caption font-semibold transition-colors ${
              active ? "bg-brand text-on-brand" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {LOCALE_NAMES[locale]}
          </button>
        );
      })}
    </div>
  );
}
