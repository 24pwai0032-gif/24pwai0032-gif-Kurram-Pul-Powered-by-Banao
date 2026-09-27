"use client";

import { useEffect, useState, type ReactNode } from "react";
import { INTRO_COOKIE } from "@/lib/about";
import { dirFor, LOCALE_COOKIE, translate } from "@/lib/i18n";
import { MINUTE_MS } from "@/lib/staleness";
import { loadWork, saveWork } from "@/lib/savedWork";
import { AppStoreContext, createAppStore, savedWork, type AppStoreInit } from "@/lib/store";

type AppStoreProviderProps = AppStoreInit & { children: ReactNode };

export function AppStoreProvider({ children, ...init }: AppStoreProviderProps) {
  const [store] = useState(() => createAppStore(init));

  useEffect(() => {
    const id = window.setInterval(() => store.getState().tick(), MINUTE_MS);
    return () => window.clearInterval(id);
  }, [store]);

  // <html> is rendered by the server layout, so a language switch updates it directly
  // and saves the choice in a cookie for the next server render.
  useEffect(
    () =>
      store.subscribe((state, prev) => {
        if (state.language === prev.language) return;
        const root = document.documentElement;
        root.lang = state.language;
        root.dir = dirFor(state.language);
        document.title = translate(state.language, "app.name");
        document.cookie = `${LOCALE_COOKIE}=${state.language}; path=/; max-age=31536000; samesite=lax`;
      }),
    [store],
  );

  // Bring back this visitor's own work after a reload, then keep saving it as it changes.
  // Restoring after the first render keeps the server and client renders identical.
  useEffect(() => {
    const saved = loadWork();
    if (saved) store.getState().restore(saved);
    return store.subscribe((state, prev) => {
      if (
        state.areas !== prev.areas ||
        state.triageCases !== prev.triageCases ||
        state.notified !== prev.notified ||
        state.triage.messages !== prev.triage.messages ||
        state.triage.area !== prev.triage.area ||
        state.triage.mode !== prev.triage.mode
      ) {
        saveWork(savedWork(state));
      }
    });
  }, [store]);

  // Once the visitor has taken the tour, stop offering it. "Not now" only hides it for this visit.
  useEffect(
    () =>
      store.subscribe((state, prev) => {
        if (prev.tour === null && state.tour !== null) {
          document.cookie = `${INTRO_COOKIE}=seen; path=/; max-age=31536000; samesite=lax`;
        }
      }),
    [store],
  );

  return <AppStoreContext value={store}>{children}</AppStoreContext>;
}
