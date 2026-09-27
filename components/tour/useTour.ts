"use client";

import { useCallback } from "react";
import { areaAnchorId } from "@/lib/dashboard";
import { matchAnchorId, useGoTo } from "@/lib/navigation";
import { useAppStore } from "@/lib/store";
import { TOUR_AREA, TOUR_MATCH_SUPPLY, type TourStep } from "@/lib/tour";
import { useT } from "@/lib/useT";

/** Moves the guided tour to a step and does what that step shows. */
export function useTour() {
  const { t } = useT();
  const goTo = useGoTo();
  const setTour = useAppStore((s) => s.setTour);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setTriageMode = useAppStore((s) => s.setTriageMode);
  const setTriageArea = useAppStore((s) => s.setTriageArea);
  const resetTriage = useAppStore((s) => s.resetTriage);
  const send = useAppStore((s) => s.sendTriageMessage);
  const dismissIntro = useAppStore((s) => s.dismissIntro);

  const go = useCallback(
    (step: TourStep) => {
      setTour(step);
      if (step === "about") {
        setActiveView("about");
        window.scrollTo({ top: 0 });
      } else if (step === "triage") {
        // A fresh, real case: the critical example, logged to Parachinar in chat mode.
        setActiveView("triage");
        setTriageMode("chat");
        resetTriage();
        setTriageArea(TOUR_AREA);
        window.scrollTo({ top: 0 });
        void send(t("triage.quick.critical.text"), { newCase: true });
      } else if (step === "dashboard") {
        goTo("dashboard", areaAnchorId(TOUR_AREA));
      } else if (step === "matcher") {
        goTo("matcher", matchAnchorId(TOUR_AREA, TOUR_MATCH_SUPPLY));
      } else if (step === "forecast") {
        setActiveView("forecast");
        window.scrollTo({ top: 0 });
      }
    },
    [goTo, resetTriage, send, setActiveView, setTour, setTriageArea, setTriageMode, t],
  );

  const start = useCallback(() => {
    dismissIntro();
    go("about");
  }, [dismissIntro, go]);

  const exit = useCallback(() => setTour(null), [setTour]);

  return { go, start, exit };
}
