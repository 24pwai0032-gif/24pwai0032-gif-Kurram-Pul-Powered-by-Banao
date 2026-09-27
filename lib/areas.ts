/**
 * Which areas are a short, local trip from each other. This is the "simple named-area
 * adjacency" the surplus matcher ranks by (SPEC section 8). It follows the real road order
 * (lib/geo.ts, from OpenStreetMap): Pewar – Parachinar in Upper Kurram, then down the
 * Thall road through Balishkhel, Sadda and Alizai to Bagan in Lower Kurram.
 * Kept in code rather than seed-reports.json so that file matches the spec's shape exactly.
 */
export const AREA_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["Pewar", "Parachinar City Center"],
  ["Parachinar City Center", "Balishkhel"],
  ["Balishkhel", "Sadda"],
  ["Sadda", "Alizai"],
  ["Alizai", "Bagan"],
];

export function neighboursOf(areaName: string): string[] {
  return AREA_LINKS.flatMap(([a, b]) => (a === areaName ? [b] : b === areaName ? [a] : []));
}

/** Hop counts along AREA_LINKS from one area to every area reachable from it (itself = 0). */
export function hopsFrom(start: string): Map<string, number> {
  const hops = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of neighboursOf(current)) {
      if (!hops.has(next)) {
        hops.set(next, hops.get(current)! + 1);
        queue.push(next);
      }
    }
  }
  return hops;
}
