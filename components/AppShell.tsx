"use client";

import { Menu } from "lucide-react";
import { useState, type ComponentType } from "react";
import { AboutCrisis } from "@/components/AboutCrisis";
import { ForecasterPanel } from "@/components/ForecasterPanel";
import { IntroDialog } from "@/components/IntroDialog";
import { ShortageDashboard } from "@/components/ShortageDashboard";
import { BrandMark } from "@/components/sidebar/BrandMark";
import { MobileDrawer } from "@/components/sidebar/MobileDrawer";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SurplusMatcher } from "@/components/SurplusMatcher";
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
 * Desktop: a persistent sidebar at the reading start edge. Phones and tablets: a top bar with
 * a menu button (the sidebar becomes a drawer) and an always-visible "Demo data" chip.
 */
export function AppShell() {
  const { t } = useT();
  const activeView = useAppStore((s) => s.activeView);
  const ActiveView = VIEW_COMPONENTS[activeView];
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh overflow-y-auto bg-side lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            data-menu-button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.open")}
            aria-expanded={drawerOpen}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-ink hover:bg-surface-2"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <BrandMark size="sm" />
          <span className="truncate font-bold text-ink">{t("app.name")}</span>
          <span
            title={t("app.demoBadgeText")}
            className="ms-auto shrink-0 rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[11px] font-semibold text-ink-2"
          >
            {t("app.demoBadge")}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-10 lg:px-8 lg:pt-8">
          <ActiveView />
        </main>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <IntroDialog />
    </div>
  );
}
