"use client";

import { useEffect, useRef } from "react";
import { useTour } from "@/components/tour/useTour";
import { useAppStore } from "@/lib/store";

/** How long the About page shows on its own before the tour's first card appears. */
const DELAY_MS = 800;

/**
 * A first visit starts the 60-second tour by itself. Its first step stays on the About page (the
 * place, the closure, the children who died), so the visitor still meets the problem before the
 * product, and the tour card says what comes next. Exiting is one tap; the tour stays one tap
 * away in the sidebar and the About header. Taking it (or exiting it) is remembered, so a return
 * visit opens quietly on About.
 */
export function TourAutoStart() {
  const firstVisit = useAppStore((s) => s.introOpen && s.tour === null);
  const { start } = useTour();
  const started = useRef(false);

  useEffect(() => {
    if (!firstVisit || started.current) return;
    started.current = true;
    const timer = window.setTimeout(start, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [firstVisit, start]);

  return null;
}
