import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { ApiError, fetchForecast, fetchMatchReview, fetchSummary, fetchTriage, type AiText } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { AreaRecord, ClosureHistory, ReportRecord, SeedReports, SupplyStatus, TriageCaseRecord, VerificationTag } from "@/lib/schemas";
import { loadSeed, toSeedShape } from "@/lib/seed";
import { canonicalSupply, sameSupply } from "@/lib/stock";
import type { TourStep } from "@/lib/tour";
import { composeDescription, type TriageClassification } from "@/lib/triage";

export const VIEWS = ["about", "dashboard", "matcher", "triage", "forecast"] as const;
export type ViewId = (typeof VIEWS)[number];

/** A free-text AI answer being fetched: the dashboard summary and the matcher's AI review. */
export type AiTextState =
  | { status: "idle" }
  | { status: "loading" }
  | ({ status: "ready"; dataVersion: number; language: Locale } & AiText)
  | { status: "error"; message: string; code: string | undefined };

/** One line of the triage conversation. The chat and SMS views both render these. */
export type TriageMessage =
  | { id: string; at: string; role: "user"; text: string }
  | { id: string; at: string; role: "assistant"; kind: "clarification"; question: string }
  | {
      id: string;
      at: string;
      role: "assistant";
      kind: "classification";
      result: TriageClassification;
      /** The area the case was logged against on the dashboard. */
      area: string;
      model: string;
    }
  | { id: string; at: string; role: "assistant"; kind: "error"; message: string; code: string | undefined };

export interface TriageState {
  mode: "chat" | "sms";
  area: string | null;
  messages: TriageMessage[];
  pending: boolean;
  /** Set while the assistant waits for the answer to its clarifying question. */
  awaiting: { description: string; question: string } | null;
  /** The last description sent, so "Try again" can resend it after an error. */
  lastDescription: string | null;
  /** Text being typed. Shared by the chat and SMS views, so switching modes keeps it. */
  draft: string;
}

export interface AppState {
  language: Locale;
  activeView: ViewId;
  /** The first-visit "About this crisis" dialog. */
  introOpen: boolean;
  /** The guided tour's current step, or null when it isn't running. */
  tour: TourStep | null;
  areas: AreaRecord[];
  triageCases: TriageCaseRecord[];
  verificationTags: VerificationTag[];
  closureHistory: ClosureHistory;
  /** Clock for staleness math. Ticks once a minute so "X h ago" labels stay current. */
  now: number;
  /** Bumped whenever reports or triage cases change, so an older AI summary can say it's out of date. */
  dataVersion: number;
  /** AI answers live in the store so switching tabs doesn't refetch (each fetch is a paid LLM call). */
  summary: AiTextState;
  matchReview: AiTextState;
  forecast: AiTextState;
  /** Surplus matches whose "notify coordinator" demo button was pressed: match id → when. */
  notified: Record<string, string>;
  /** Kept in the store so the conversation survives a trip to the dashboard and back. */
  triage: TriageState;
}

export interface AppActions {
  setLanguage: (language: Locale) => void;
  setActiveView: (view: ViewId) => void;
  dismissIntro: () => void;
  setTour: (step: TourStep | null) => void;
  tick: () => void;
  /** Asks /api/aggregate for a fresh summary of the current reports. No-op while one is loading. */
  requestSummary: () => Promise<void>;
  /** Asks /api/surplus-match for the AI's review of possible matches. No-op while one is loading. */
  requestMatchReview: () => Promise<void>;
  /** Asks /api/forecast for the closure-risk estimate. No-op while one is loading. */
  requestForecast: () => Promise<void>;
  /** Demo only: marks a match as sent to a coordinator (no message actually goes out). */
  notifyCoordinator: (matchId: string) => void;
  setTriageMode: (mode: TriageState["mode"]) => void;
  setTriageArea: (area: string) => void;
  setTriageDraft: (draft: string) => void;
  /**
   * Sends a new description, or the answer to a pending clarifying question.
   * With newCase, always starts a fresh case (used by the one-tap examples).
   */
  sendTriageMessage: (text: string, options?: { newCase?: boolean }) => Promise<void>;
  retryTriage: () => Promise<void>;
  resetTriage: () => void;
  /**
   * Adds a stock report from a pharmacy, facility, coordinator or elder. It replaces the area's
   * previous report for the same supply and starts unverified. Returns the new report's id.
   */
  addReport: (input: { area: string; supply: string; status: SupplyStatus; reportedBy: string }) => string;
  /** Puts back what this visitor did before a reload (see AppStoreProvider). */
  restore: (saved: SavedWork) => void;
}

/** What survives a reload: the visitor's own reports, logged cases, notifications and conversation. */
export interface SavedWork {
  reports: { area: string; report: ReportRecord }[];
  cases: TriageCaseRecord[];
  notified: Record<string, string>;
  triage: Pick<TriageState, "mode" | "area" | "messages">;
}

/** The area's reports with a new one in place of any earlier report for the same supply. */
function withReport(areas: AreaRecord[], areaName: string, report: ReportRecord): AreaRecord[] {
  return areas.map((a) =>
    a.name === areaName ? { ...a, reports: [report, ...a.reports.filter((r) => !sameSupply(r.supply, report.supply))] } : a,
  );
}

/** Reads the visitor's saved work out of the store, for saving. */
export function savedWork(s: AppState): SavedWork {
  return {
    reports: s.areas.flatMap((a) => a.reports.filter((r) => r.submitted).map((report) => ({ area: a.name, report }))),
    cases: s.triageCases.filter((c) => c.loggedAt !== undefined),
    notified: s.notified,
    triage: { mode: s.triage.mode, area: s.triage.area, messages: s.triage.messages },
  };
}

export type AppStore = AppState & AppActions;

export interface AppStoreInit {
  language: Locale;
  /** False once the visitor has dismissed the intro (remembered in a cookie). */
  showIntro: boolean;
  seed: SeedReports;
  verificationTags: VerificationTag[];
  closureHistory: ClosureHistory;
}

let idSeq = 0;
/** Unique within the page. (crypto.randomUUID needs HTTPS, which a phone testing over LAN won't have.) */
function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;
}

function stamp(): { id: string; at: string } {
  return { id: nextId("msg"), at: new Date().toISOString() };
}

/**
 * One store per request on the server and one per page load in the browser
 * (created by <AppStoreProvider>), so state never leaks between users.
 */
export function createAppStore({ language, showIntro, seed, verificationTags, closureHistory }: AppStoreInit): StoreApi<AppStore> {
  const now = Date.now();
  const { areas, triageCases } = loadSeed(seed, now);

  return createStore<AppStore>()((set, get) => {
    const updateTriage = (patch: Partial<TriageState>) => set((s) => ({ triage: { ...s.triage, ...patch } }));

    const runAiText = async (
      key: "summary" | "matchReview" | "forecast",
      fetcher: (data: SeedReports, language: Locale) => Promise<AiText>,
    ) => {
      if (get()[key].status === "loading") return;
      const { dataVersion, language } = get();
      set({ [key]: { status: "loading" } });
      try {
        const result = await fetcher(toSeedShape(get().areas, get().triageCases), language);
        set({ [key]: { status: "ready", dataVersion, language, ...result } });
      } catch (error) {
        set({
          [key]: {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
            code: error instanceof ApiError ? error.code : undefined,
          },
        });
      }
    };
    const addTriageMessage = (message: TriageMessage) =>
      set((s) => ({ triage: { ...s.triage, messages: [...s.triage.messages, message] } }));

    const runTriage = async (description: string) => {
      const area = get().triage.area;
      if (area === null) return;
      updateTriage({ pending: true, lastDescription: description });
      try {
        const { provider, model, ...reply } = await fetchTriage(description, get().language);
        if (reply.kind === "clarification") {
          addTriageMessage({ ...stamp(), role: "assistant", kind: "clarification", question: reply.question });
          updateTriage({ awaiting: { description, question: reply.question } });
          return;
        }
        // Log the case where the dashboard (and later the surplus matcher) will see it.
        const loggedCase: TriageCaseRecord = {
          id: nextId("case"),
          area,
          urgency_tier: reply.urgency_tier,
          // The model names supplies in its own words; log it under the reports' name.
          supply_needed: reply.supply_needed === null ? null : canonicalSupply(reply.supply_needed, get().areas),
          loggedAt: new Date().toISOString(),
        };
        set((s) => ({ triageCases: [...s.triageCases, loggedCase], dataVersion: s.dataVersion + 1 }));
        addTriageMessage({
          ...stamp(),
          role: "assistant",
          kind: "classification",
          result: reply,
          area,
          model: `${provider} ${model}`,
        });
        updateTriage({ awaiting: null });
      } catch (error) {
        addTriageMessage({
          ...stamp(),
          role: "assistant",
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
          code: error instanceof ApiError ? error.code : undefined,
        });
      } finally {
        updateTriage({ pending: false });
      }
    };

    return {
      language,
      // A first visit opens on the story (About) with the tour offered; a return visit, on the dashboard.
      activeView: showIntro ? "about" : "dashboard",
      introOpen: showIntro,
      tour: null,
      areas,
      triageCases,
      verificationTags,
      closureHistory,
      now,
      dataVersion: 0,
      summary: { status: "idle" },
      matchReview: { status: "idle" },
      forecast: { status: "idle" },
      notified: {},
      triage: { mode: "chat", area: null, messages: [], pending: false, awaiting: null, lastDescription: null, draft: "" },

      setLanguage: (language) => set({ language }),
      setActiveView: (activeView) => set({ activeView }),
      dismissIntro: () => set({ introOpen: false }),
      setTour: (tour) => set({ tour }),
      tick: () => set({ now: Date.now() }),

      requestSummary: () => runAiText("summary", fetchSummary),
      requestMatchReview: () => runAiText("matchReview", fetchMatchReview),
      requestForecast: () => runAiText("forecast", fetchForecast),
      notifyCoordinator: (matchId) =>
        set((s) => ({ notified: { ...s.notified, [matchId]: new Date().toISOString() } })),

      setTriageMode: (mode) => updateTriage({ mode }),
      setTriageArea: (area) => updateTriage({ area }),
      setTriageDraft: (draft) => updateTriage({ draft }),
      sendTriageMessage: async (text, options) => {
        const { triage } = get();
        const message = text.trim();
        if (!message || triage.pending || triage.area === null) return;
        const awaiting = options?.newCase ? null : triage.awaiting;
        if (options?.newCase) updateTriage({ awaiting: null });
        const description = awaiting ? composeDescription(awaiting.description, awaiting.question, message) : message;
        addTriageMessage({ ...stamp(), role: "user", text: message });
        updateTriage({ draft: "" });
        await runTriage(description);
      },
      retryTriage: async () => {
        const { lastDescription, pending } = get().triage;
        if (lastDescription !== null && !pending) await runTriage(lastDescription);
      },
      addReport: ({ area, supply, status, reportedBy }) => {
        const report: ReportRecord = {
          id: nextId("report"),
          supply: canonicalSupply(supply, get().areas),
          status,
          reported_by: reportedBy.trim(),
          verified_by: null,
          timestamp: new Date().toISOString(),
          submitted: true,
        };
        set((s) => ({ areas: withReport(s.areas, area, report), dataVersion: s.dataVersion + 1 }));
        return report.id;
      },

      restore: (saved) =>
        set((s) => ({
          areas: saved.reports.reduce((areas, { area, report }) => withReport(areas, area, report), s.areas),
          triageCases: [...s.triageCases.filter((c) => c.loggedAt === undefined), ...saved.cases],
          notified: saved.notified,
          triage: { ...s.triage, ...saved.triage },
          dataVersion: s.dataVersion + 1,
        })),

      resetTriage: () => updateTriage({ messages: [], awaiting: null, lastDescription: null }),
    };
  });
}

export const AppStoreContext = createContext<StoreApi<AppStore> | null>(null);

export function useAppStore<T>(selector: (state: AppStore) => T): T {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return useStore(store, selector);
}
