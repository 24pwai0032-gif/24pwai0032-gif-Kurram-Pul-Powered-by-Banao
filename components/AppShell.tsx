"use client";

import { Menu } from "lucide-react";
import { useState, type ComponentType, type CSSProperties } from "react";
import { AboutCrisis } from "@/components/AboutCrisis";
import { ForecasterPanel } from "@/components/ForecasterPanel";
import { ShortageDashboard } from "@/components/ShortageDashboard";
import { BrandMark } from "@/components/sidebar/BrandMark";
import { MobileDrawer } from "@/components/sidebar/MobileDrawer";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarResizer, useSidebarWidth } from "@/components/sidebar/SidebarResizer";
import { SurplusMatcher } from "@/components/SurplusMatcher";
import { TourCoach } from "@/components/tour/TourCoach";
import { TourPrompt } from "@/components/tour/TourPrompt";
import { TriageChat } from "@/components/TriageChat";
import { useAppStore, type ViewId } from "@/lib/store";
import { useT } from "@/lib/useT";

const VIEW_COMPONENTS: Record<ViewId, ComponentType> = {
  about: AboutCrisis,
  dashboard: ShortageDashboard,
  matcher: SurplusMatcher,
  triage: TriageChat,
  forecast: ForecasterPanel,
};

/**
 * Desktop: a persistent sidebar at the reading start edge, which the visitor can drag wider or
 * narrower. Phones and tablets: a top bar with
 * a menu button (the sidebar becomes a drawer) and an always-visible "Demo data" chip.
 */
export function AppShell() {
  const { t } = useT();
  const activeView = useAppStore((s) => s.activeView);
  const ActiveView = VIEW_COMPONENTS[activeView];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touring = useAppStore((s) => s.tour !== null);
  const sidebarWidth = useSidebarWidth();

  return (
    <div
      className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <aside className="sticky top-0 hidden h-dvh overflow-y-auto bg-sign lg:block">
        <SidebarContent />
        <SidebarResizer />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header data-sign className="sticky top-0 z-30 flex items-center gap-3 bg-sign px-4 py-3 text-on-sign lg:hidden">
          <button
            type="button"
            data-menu-button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.open")}
            aria-expanded={drawerOpen}
            className="grid size-10 shrink-0 place-items-center rounded-md border border-sign-raised text-on-sign transition-colors hover:bg-sign-raised"
          >
            <Menu aria-hidden />
          </button>
          <BrandMark size="sm" />
          <span className="truncate font-display text-title font-bold tracking-wide text-on-sign uppercase">{t("app.name")}</span>
          <span
            title={t("app.demoBadgeText")}
            className="ms-auto shrink-0 rounded-md border border-dashed border-on-sign-muted px-2 py-1 text-caption font-medium text-on-sign-muted"
          >
            {t("app.demoBadge")}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 lg:px-8 lg:pt-8">
          <ActiveView />
          {/* Room for the tour's coach, so it never covers the end of the page. */}
          {touring && <div aria-hidden className="h-64" />}
        </main>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <TourPrompt />
      <TourCoach />
    </div>
  );
}
