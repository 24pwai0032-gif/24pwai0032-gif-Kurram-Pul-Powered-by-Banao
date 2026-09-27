/**
 * The real-world facts behind the "About this crisis" panel, each with the source it came
 * from. Everything here was checked against the cited article; keep it that way.
 */

export type OutletId = "dawn" | "nation" | "geo" | "news" | "brecorder";

export interface Source {
  outlet: OutletId;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  url: string;
}

export const SOURCES = {
  // "the road was shut down for all types of vehicular traffic following an attack on a convoy
  //  of passenger vehicles on October 12"
  closureStart: {
    outlet: "nation",
    date: "2024-10-24",
    url: "https://www.nation.com.pk/24-Oct-2024/closure-of-parachinar-thall-highway-disrupts-life-in-kurram",
  },
  // "Following the reopening of the Tal-Parachinar road for the first time after three months"
  firstConvoy: {
    outlet: "geo",
    date: "2025-01-04",
    url: "https://www.geo.tv/latest/583325-first-convoy-to-pass-through-tal-parachinar-road-today-after-three-month-closure",
  },
  // "At least 50 children have died in Parachinar due to the recent shortage of medicines
  //  caused by the closure of roads."
  childDeaths: {
    outlet: "dawn",
    date: "2024-12-22",
    url: "https://www.dawn.com/news/1880344",
  },
  // "3G and 4G services had remained suspended in the district for nearly two years."
  mobileData: {
    outlet: "news",
    date: "2026-06-30",
    url: "https://www.thenews.pk/print/1423122-restoration-of-internet-mobile-network-sought-in-kurram",
  },
  // "The peace deal was brokered by a Grand jirga in Kohat" ... "signed a 14-point peace accord"
  jirgaAccord: {
    outlet: "brecorder",
    date: "2025-01-01",
    url: "https://www.brecorder.com/news/40340562/kurram-dispute-grand-jirga-strikes-peace-deal-as-both-sides-sign-agreement",
  },
} as const satisfies Record<string, Source>;

/** The 2024-25 closure the app is modeled on. */
export const MODEL_CLOSURE = {
  /** Road shut to all traffic after a convoy attack. */
  start: "2024-10-12",
  /** First relief convoy sent. */
  firstConvoy: "2025-01-04",
  /** "At least 50 children" (Dawn, 22 Dec 2024). */
  childDeathsAtLeast: 50,
  /** Date the jirga peace accord was signed. */
  jirgaAccord: "2025-01-01",
} as const;

/** Set once the first-visit intro has been dismissed, so the server knows not to show it again. */
export const INTRO_COOKIE = "kp-intro";

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}
