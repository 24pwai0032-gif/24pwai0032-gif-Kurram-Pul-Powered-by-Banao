import { useEffect, useState, type CSSProperties } from "react";

/**
 * Entrance order for the `rise` utility (design-tokens.css): card n starts n × --motion-stagger
 * after the first, so a list settles in sequence instead of snapping in at once.
 */
export const riseOrder = (index: number): CSSProperties => ({ "--rise-index": index }) as CSSProperties;

// Keys already shown this session. Module-level, so it survives switching between views.
const seen = new Set<string>();

/**
 * True the first time `key` renders in this session, false every time after. For one-off
 * attention cues: a newly logged critical case pulses once on the dashboard and once on the
 * matcher, not every time those views are opened.
 */
export function useFirstSight(key: string | null): boolean {
  const [first] = useState(() => key !== null && !seen.has(key));
  useEffect(() => {
    if (key !== null) seen.add(key);
  }, [key]);
  return first;
}

/** Whether the visitor asked their system for reduced motion. */
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
