"use client";

import { AboutContent } from "@/components/about/AboutContent";
import { AboutHero } from "@/components/about/AboutHero";
import { useAppStore, type ViewId } from "@/lib/store";

/**
 * "About this crisis": the app's centerpiece. A hero with the place and the pitch, then the same
 * content as the first-visit intro. Reachable any time from the sidebar.
 */
export function AboutCrisis() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const open = (view: ViewId) => {
    setActiveView(view);
    window.scrollTo({ top: 0 });
  };

  return (
    <section aria-labelledby="about-title" className="mx-auto max-w-5xl space-y-12">
      <AboutHero />
      <AboutContent onNavigate={open} />
    </section>
  );
}
