"use client";

import { useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { useT } from "@/lib/useT";

/** The desktop sidebar's width in px: 256 by default, draggable between 224 and 384. */
export const SIDEBAR_WIDTH = { min: 224, max: 384, initial: 256 } as const;
const KEY = "kurram-pul:sidebar-width";
const STEP = 16;

const clamp = (px: number) => Math.round(Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, px)));

// A tiny external store, so the width survives a reload without a hydration mismatch: the server
// renders the default and the client switches to the saved width straight after hydrating.
let width: number = SIDEBAR_WIDTH.initial;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  try {
    const saved = Number(window.localStorage.getItem(KEY));
    if (saved) width = clamp(saved);
  } catch {
    // Storage blocked (a private window): keep the default.
  }
}

function setWidth(px: number) {
  width = clamp(px);
  try {
    window.localStorage.setItem(KEY, String(width));
  } catch {
    // Not saved; the new width still applies until the page closes.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useSidebarWidth(): number {
  return useSyncExternalStore(subscribe, () => width, () => SIDEBAR_WIDTH.initial);
}

/**
 * The sidebar's resize handle, on its inner edge. Drag it, use the arrow keys (Home and End for
 * the narrowest and widest), or double-click it to go back to the default width.
 */
export function SidebarResizer() {
  const { t } = useT();
  const current = useSidebarWidth();

  // In right-to-left layouts the sidebar sits on the right, so the pointer and the arrows flip.
  const isRtl = () => document.documentElement.dir === "rtl";

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const handle = e.currentTarget;
    const aside = handle.parentElement;
    if (!aside) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const rtl = isRtl();
    const move = (ev: globalThis.PointerEvent) => {
      const rect = aside.getBoundingClientRect();
      setWidth(rtl ? rect.right - ev.clientX : ev.clientX - rect.left);
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
      document.body.classList.remove("select-none", "cursor-col-resize");
    };
    document.body.classList.add("select-none", "cursor-col-resize");
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const grow = isRtl() ? "ArrowLeft" : "ArrowRight";
    const shrink = isRtl() ? "ArrowRight" : "ArrowLeft";
    const next =
      e.key === grow ? current + STEP : e.key === shrink ? current - STEP : e.key === "Home" ? SIDEBAR_WIDTH.min : e.key === "End" ? SIDEBAR_WIDTH.max : null;
    if (next === null) return;
    e.preventDefault();
    setWidth(next);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t("nav.resize")}
      aria-valuenow={current}
      aria-valuemin={SIDEBAR_WIDTH.min}
      aria-valuemax={SIDEBAR_WIDTH.max}
      tabIndex={0}
      title={t("nav.resize")}
      data-sidebar-resizer
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => setWidth(SIDEBAR_WIDTH.initial)}
      className="group absolute inset-y-0 end-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center outline-none"
    >
      {/* A grip that brightens on hover and focus, as the edge of the sign panel. */}
      <span
        aria-hidden
        className="h-12 w-1 rounded-sm bg-on-sign-muted/40 transition-colors group-hover:bg-signal group-focus-visible:bg-signal"
      />
    </div>
  );
}
