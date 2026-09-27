"use client";

import { useT } from "@/lib/useT";

const STEPS = ["report", "see", "match", "prepare"] as const;

/**
 * The whole system in four steps (report → see → match → prepare), so a first-time visitor
 * understands the loop before opening any one screen. Two columns in the intro dialog, four
 * across on the About page.
 */
export function HowItWorks() {
  const { t } = useT();
  return (
    <section aria-labelledby="how-title" className="@container">
      <h2 id="how-title" className="text-title text-text-primary">
        {t("about.how.title")}
      </h2>
      <ol className="mt-4 grid gap-6 @md:grid-cols-2 @3xl:grid-cols-4 @3xl:gap-4">
        {STEPS.map((step, i) => (
          <li key={step} className="border-t border-border-control pt-3">
            <h3 className="flex items-baseline gap-2 text-lead text-text-primary">
              <span className="text-brand-text tabular-nums">{i + 1}</span>
              {t(`about.how.${step}.title`)}
            </h3>
            <p className="mt-1 text-body text-text-secondary">{t(`about.how.${step}.body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
