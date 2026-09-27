import { useCallback } from "react";
import { slug } from "@/lib/seed";
import { useAppStore, type ViewId } from "@/lib/store";

/** Anchor ids for cards other screens link to. */
export const matchAnchorId = (area: string, supply: string) => `match-${slug(area)}-${slug(supply)}`;
export const unmatchedAnchorId = (supply: string) => `unmatched-${slug(supply)}`;

/**
 * Switches view, jumps to the first of `anchorIds` that exists and rings it once (the
 * `attention` utility), so the link between screens (a triage case → its dashboard card) is
 * visible, not implied.
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
        target.scrollIntoView({ block: "start" });
        // Restart the ring even if this card was the target last time.
        target.classList.remove("attention");
        void target.offsetWidth;
        target.classList.add("attention");
      }, 60);
    },
    [setActiveView],
  );
}
