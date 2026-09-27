"use client";

import { AboutContent } from "@/components/about/AboutContent";
import { useAppStore, type ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

/** "About this crisis": the same content as the first-visit intro, reachable any time from the nav. */
export function AboutCrisis() {
  const { t } = useT();
  const setActiveView = useAppStore((s) => s.setActiveView);
  const open = (view: ViewId) => {
    setActiveView(view);
    window.scrollTo({ top: 0 });
  };

  return (
    <section aria-labelledby="about-title" className="mx-auto max-w-3xl space-y-5">
      <h1 id="about-title" className="text-xl font-semibold text-ink">
        {t("about.title")}
      </h1>
      <AboutContent onNavigate={open} />
    </section>
  );
}
