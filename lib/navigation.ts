import { useCallback } from "react";
import { slug } from "@/lib/seed";
import { useAppStore, type ViewId } from "@/lib/store";

/** Anchor ids for cards other screens link to. */
export const matchAnchorId = (area: string, supply: string) => `match-${slug(area)}-${slug(supply)}`;
export const unmatchedAnchorId = (supply: string) => `unmatched-${slug(supply)}`;

/**
 * Switches view, then scrolls to the first of `anchorIds` that exists and briefly outlines it,
 * so the link between screens (a triage case → its dashboard card) is visible, not implied.
 */
export function useGoTo() {
  const setActiveView = useAppStore((s) => s.setActiveView);

  return useCallback(
    (view: ViewId, ...anchorIds: string[]) => {
      setActiveView(view);
      // Wait for the new view to render before looking for the anchor.
      window.setTimeout(() => {
        const target = anchorIds.map((id) => document.getElementById(id)).find((el) => el !== null);
        if (!target) {
          window.scrollTo({ top: 0 });
          return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          target.animate(
            [{ boxShadow: "0 0 0 3px var(--focus)" }, { boxShadow: "0 0 0 3px var(--focus)", offset: 0.6 }, { boxShadow: "0 0 0 0 transparent" }],
            { duration: 1800, easing: "ease-out" },
          );
        }
      }, 60);
    },
    [setActiveView],
  );
}
