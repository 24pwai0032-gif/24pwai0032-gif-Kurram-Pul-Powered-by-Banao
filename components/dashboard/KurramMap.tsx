"use client";

import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { AFGHANISTAN_LABEL, AREA_COORDS, CLOSURES, KHARLACHI_ROAD, MAIN_ROAD, PEWAR_ROAD, type LatLng } from "@/lib/geo";
import { useGoTo } from "@/lib/navigation";
import { CONDITION_TOKEN, type AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

// Pin glyphs, drawn at the origin of a -11..11 box. Each status has its own shape, so colour is
// never the only cue: ! critical, – low, ✓ stable, + surplus, and a hollow dashed clock for silence.
const GLYPH: Record<AreaCondition, string> = {
  critical: `<rect x="-1.3" y="-5.2" width="2.6" height="6.4" rx="1.2" fill="var(--color-on-severity)"/><circle cy="3.9" r="1.4" fill="var(--color-on-severity)"/>`,
  low: `<rect x="-4.5" y="-1.3" width="9" height="2.6" rx="1.2" fill="var(--color-on-warning)"/>`,
  stable: `<path d="M-4 0.3 L-1.3 3 L4 -2.6" fill="none" stroke="var(--color-on-severity)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  surplus: `<path d="M0 -4.5 V4.5 M-4.5 0 H4.5" stroke="var(--color-on-severity)" stroke-width="2.4" stroke-linecap="round"/>`,
  stale: `<path d="M0 -4.5 V0 L3 2" fill="none" stroke="var(--color-stale-text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

const svg = (body: string) => `<svg viewBox="-11 -11 22 22" width="100%" height="100%" aria-hidden="true">${body}</svg>`;

function pinSvg(condition: AreaCondition): string {
  const disc =
    condition === "stale"
      ? `<circle r="9" fill="var(--color-surface)" stroke="var(--color-stale-text)" stroke-width="2" stroke-dasharray="3 2.2"/>`
      : `<circle r="9" fill="var(--color-${CONDITION_TOKEN[condition]})" stroke="var(--color-map-ring)" stroke-width="1.5"/>`;
  return svg(disc + GLYPH[condition]);
}

const CLOSED_SVG = svg(
  `<circle r="9" fill="var(--color-critical)" stroke="var(--color-on-severity)" stroke-width="2"/><path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="var(--color-on-severity)" stroke-width="2.2" stroke-linecap="round"/>`,
);
const TOWN_SVG = svg(`<circle r="7" fill="var(--color-sign)" stroke="var(--color-on-sign)" stroke-width="3"/>`);

const LEGEND: AreaCondition[] = ["critical", "low", "stable", "surplus", "stale"];

/** Where each label sits beside its marker, so neighbours' labels don't collide at the district zoom. */
type Side = "right" | "left" | "top" | "bottom";
const LABEL_SIDE: Record<string, Side> = { Pewar: "top", Balishkhel: "top", Alizai: "left" };

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A marker's HTML: the pin plus its always-visible name, in the page's language and font. */
function markerHtml(pin: string, label: string, side: Side, tone: "place" | "closed" | "country" = "place") {
  return `${pin}<span class="kp-map-label kp-map-label-${side} kp-map-label-${tone}" dir="auto">${escapeHtml(label)}</span>`;
}

interface KurramMapProps {
  /**
   * "status": the dashboard's map, one severity pin per area, each opening its card.
   * "place": the About page's map, the geography of the problem: the towns, the one road and its closed ends.
   */
  variant?: "status" | "place";
  summaries?: AreaSummary[];
  title: string;
  caption: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The district on a real map (Leaflet, over Esri's topographic tiles): every area at its coordinates, the
 * Thall–Parachinar road as it actually runs, and where it is closed. Without a connection the tiles
 * don't load, but the roads, pins and labels are drawn locally, so the map still reads.
 * Scroll-wheel zoom is off so the page scrolls past it, and on phones one finger scrolls the page.
 */
export function KurramMap({ variant = "status", summaries = [], title, caption, className = "", style }: KurramMapProps) {
  const { t, tArea, locale } = useT();
  const goTo = useGoTo();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const titleId = `map-title-${variant}`;

  // The map itself, once: tiles, the roads, and the view fitted to the district.
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || map.current) return;
      const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

      const m = L.map(box.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile, zoomSnap: 0.25, zoomControl: false });
      // Top right is open country on both screen sizes; top left would cover Pewar's label on phones.
      L.control.zoom({ position: "topright" }).addTo(m);
      // Leaflet is credited in the README; dropping its prefix keeps the tile credit on one line on phones.
      m.attributionControl.setPrefix(false);
      // Esri's topographic basemap: the mountains that close the valley in, the border, the Kurram
      // river, and few place names of its own, so ours (in the reader's language) stay the ones read.
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 15,
        attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> · Roads &copy; OpenStreetMap contributors',
      }).addTo(m);

      // The road the district depends on, in sign green with a white casing, as on a road map.
      for (const [line, weight] of [
        [MAIN_ROAD, variant === "place" ? 6 : 5],
        [KHARLACHI_ROAD, 4],
        [PEWAR_ROAD, 4],
      ] as [LatLng[], number][]) {
        L.polyline(line, { color: token("--color-on-sign"), weight: weight + 3, interactive: false }).addTo(m);
        L.polyline(line, { color: token("--color-sign"), weight, interactive: false }).addTo(m);
      }

      m.fitBounds(L.latLngBounds([...MAIN_ROAD, ...KHARLACHI_ROAD, ...PEWAR_ROAD, ...Object.values(AREA_COORDS)]), { padding: [32, 32] });
      markers.current = L.layerGroup().addTo(m);
      map.current = m;
      // Keep the tiles filling the box when the layout changes width.
      resize = new ResizeObserver(() => m.invalidateSize());
      resize.observe(box.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, [variant]);

  // Markers and labels: redrawn when the reports or the language change.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      const layer = markers.current;
      if (cancelled || !layer) return;
      layer.clearLayers();
      const icon = (html: string, size: number) => L.divIcon({ html, className: "kp-pin", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const still = { interactive: false, keyboard: false };

      L.marker(AFGHANISTAN_LABEL, { ...still, icon: icon(markerHtml("", t("dashboard.map.afghanistan"), "right", "country"), 0) }).addTo(layer);
      L.marker(CLOSURES.thall, { ...still, icon: icon(markerHtml(CLOSED_SVG, t("dashboard.map.thallRoad"), "left", "closed"), 24) }).addTo(layer);
      L.marker(CLOSURES.kharlachi, { ...still, icon: icon(markerHtml(CLOSED_SVG, t("dashboard.map.kharlachi"), "bottom", "closed"), 24) }).addTo(layer);

      const places =
        variant === "status"
          ? summaries.map((s) => ({ name: s.area.name, condition: s.condition as AreaCondition | null }))
          : Object.keys(AREA_COORDS).map((name) => ({ name, condition: null }));
      for (const { name, condition } of places) {
        const at = AREA_COORDS[name];
        if (!at) continue;
        // Critical areas, and Parachinar on the place map, are drawn larger.
        const size = condition === "critical" ? 32 : condition ? 26 : name === "Parachinar City Center" ? 22 : 16;
        const side = LABEL_SIDE[name] ?? "right";
        const html = markerHtml(condition ? pinSvg(condition) : TOWN_SVG, tArea(name), side);
        if (!condition) {
          L.marker(at, { ...still, icon: icon(html, size) }).addTo(layer);
          continue;
        }
        const marker = L.marker(at, { icon: icon(html, size), riseOnHover: true }).addTo(layer);
        // A button that says where it goes: "Pewar: Surplus". Enter and Space open the area's card.
        marker.getElement()?.setAttribute("aria-label", `${tArea(name)}: ${t(`status.${condition}`)}`);
        const open = () => goTo("dashboard", areaAnchorId(name));
        marker.on("click", open);
        marker.on("keypress", (e) => {
          const key = (e.originalEvent as KeyboardEvent).key;
          if (key === "Enter" || key === " ") open();
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, summaries, variant, locale, t, tArea, goTo]);

  return (
    <figure aria-labelledby={titleId} className={`card-routine ${className}`} style={style}>
      <figcaption>
        <h2 id={titleId} className="text-lead text-text-primary">
          {title}
        </h2>
        <p className="mt-1 text-caption text-text-secondary">{caption}</p>
      </figcaption>

      {/* Geography doesn't mirror in right-to-left languages. `isolate` keeps Leaflet's layers under the app's header. */}
      <div
        ref={box}
        dir="ltr"
        role="region"
        aria-label={title}
        className={`kp-map relative isolate mt-4 w-full overflow-hidden rounded-md ${variant === "place" ? "h-96 md:h-112" : "h-96"}`}
      />

      {variant === "status" ? (
        <ul aria-label={t("dashboard.map.legend")} className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-caption text-text-secondary">
          {LEGEND.map((condition) => (
            <li key={condition} className="inline-flex items-center gap-2">
              <span aria-hidden className="inline-block size-4" dangerouslySetInnerHTML={{ __html: pinSvg(condition) }} />
              {t(`status.${condition}`)}
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-label={t("dashboard.map.legend")} className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-caption text-text-secondary">
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block size-4" dangerouslySetInnerHTML={{ __html: TOWN_SVG }} />
            {t("dashboard.map.legendTown")}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-1 w-6 rounded-sm bg-sign" />
            {t("dashboard.map.legendRoad")}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block size-4" dangerouslySetInnerHTML={{ __html: CLOSED_SVG }} />
            {t("dashboard.map.legendClosed")}
          </li>
        </ul>
      )}
    </figure>
  );
}
