import type { SavedWork } from "@/lib/store";

/**
 * The visitor's own work (reports they submitted, cases they logged, coordinators they notified,
 * the triage conversation) is kept in this browser, so a reload doesn't wipe a demo halfway
 * through. It never leaves the device. Bump the version if the format changes.
 */
const KEY = "kurram-pul:work:v1";

export function loadWork(): SavedWork | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedWork;
    const ok = Array.isArray(saved.reports) && Array.isArray(saved.cases) && Array.isArray(saved.triage?.messages);
    return ok ? saved : null;
  } catch {
    return null;
  }
}

export function saveWork(work: SavedWork): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(work));
  } catch {
    // Private windows and full storage refuse writes; the app works the same without them.
  }
}

/** Forgets everything this visitor did and reloads the demo as new. */
export function resetWork(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing saved, nothing to clear.
  }
  window.location.reload();
}
