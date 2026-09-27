"use client";

import type { CSSProperties, ReactNode } from "react";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { conditionColor, type AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

const W = 360;
const H = 250;

type Anchor = "start" | "end";

interface PinPlacement {
  x: number;
  y: number;
  /** Where the label sits relative to the pin, in map units, and which side it grows from. */
  label: { dx: number; dy: number; anchor: Anchor };
}

// Stylized positions strung along the Thall–Parachinar road. Illustrative, not geographic.
const PLACEMENTS: Record<string, PinPlacement> = {
  Pewar: { x: 66, y: 50, label: { dx: 14, dy: 0, anchor: "start" } },
  "Parachinar City Center": { x: 108, y: 94, label: { dx: 10, dy: -17, anchor: "start" } },
  Alizai: { x: 168, y: 120, label: { dx: 10, dy: -15, anchor: "start" } },
  Balishkhel: { x: 212, y: 148, label: { dx: 10, dy: -15, anchor: "start" } },
  Sadda: { x: 252, y: 172, label: { dx: -14, dy: 12, anchor: "end" } },
  Bagan: { x: 292, y: 198, label: { dx: 10, dy: -15, anchor: "start" } },
};
const PLACE_ORDER = Object.keys(PLACEMENTS);

const DISTRICT =
  "M34 106 C 38 66 56 32 104 18 C 160 4 222 42 266 88 C 304 128 346 170 352 212 C 356 238 326 240 294 230 C 246 216 200 192 152 168 C 104 144 36 152 34 106 Z";
const BORDER = "M14 198 L 26 148 L 34 106 L 42 72 L 60 36 L 104 16 L 170 10";
const MAIN_ROAD =
  "M108 94 C 134 102 150 114 168 120 S 198 140 212 148 S 238 166 252 172 S 280 192 292 198 S 326 214 342 220";
const PEWAR_ROAD = "M108 94 Q 84 74 66 50";
const KHARLACHI_ROAD = "M108 94 Q 70 92 34 106";
const KHARLACHI = { x: 34, y: 106 };
const THALL = { x: 342, y: 220 };

const GLYPHS: Record<Exclude<AreaCondition, "stale">, ReactNode> = {
  critical: (
    <>
      <rect x={-1.3} y={-5.2} width={2.6} height={6.4} rx={1.2} fill="var(--color-text-primary)" />
      <circle cy={3.9} r={1.4} fill="var(--color-text-primary)" />
    </>
  ),
  low: <rect x={-4.5} y={-1.3} width={9} height={2.6} rx={1.2} fill="var(--color-background)" />,
  stable: (
    <path d="M-4 0.3 L-1.3 3 L4 -2.6" fill="none" stroke="var(--color-text-primary)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  ),
  surplus: <path d="M0 -4.5 V4.5 M-4.5 0 H4.5" stroke="var(--color-text-primary)" strokeWidth={2.4} strokeLinecap="round" />,
};

/** A status pin drawn at the origin. Each status has its own glyph, so colour is never the only cue. */
function PinGlyph({ condition }: { condition: AreaCondition }) {
  if (condition === "stale") {
    // Hollow and dashed: a silent area reads differently by shape, not just by its quiet grey.
    return (
      <g>
        <circle r={9} fill="var(--color-surface)" stroke="var(--color-stale-text)" strokeWidth={2} strokeDasharray="3 2.2" />
        <path d="M0 -4.5 V0 L3 2" fill="none" stroke="var(--color-stale-text)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  // Critical pins are drawn larger, so the most urgent places dominate the map.
  return (
    <g transform={condition === "critical" ? "scale(1.25)" : undefined}>
      <circle r={9} fill={conditionColor(condition)} stroke="var(--color-map-ring)" strokeWidth={1.5} />
      {GLYPHS[condition]}
    </g>
  );
}

function ClosedMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <circle r={7} fill="var(--color-critical)" stroke="var(--color-map-ring)" strokeWidth={1.5} />
      <path d="M-2.6 -2.6 L2.6 2.6 M2.6 -2.6 L-2.6 2.6" stroke="var(--color-text-primary)" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

/**
 * A label laid over the drawing as real text, placed by percentage. It stays at the type-scale
 * size however large the map is drawn, so a bigger map means more room between labels.
 */
function MapLabel({ x, y, anchor = "start", tone = "strong", wrap = false, hidden = false, children }: {
  x: number;
  y: number;
  anchor?: Anchor;
  tone?: "strong" | "muted" | "closed";
  wrap?: boolean;
  hidden?: boolean;
  children: ReactNode;
}) {
  const style: CSSProperties = { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` };
  const tones = {
    strong: "font-semibold text-text-primary",
    muted: "text-text-secondary",
    closed: "font-semibold text-critical-text",
  };
  return (
    <span
      aria-hidden={hidden || undefined}
      style={style}
      className={`pointer-events-none absolute -translate-y-1/2 rounded-sm bg-surface/80 px-1 text-caption ${tones[tone]} ${
        anchor === "end" ? "-translate-x-full" : ""
      } ${wrap ? "max-w-[30%]" : "whitespace-nowrap"}`}
    >
      {children}
    </span>
  );
}

const LEGEND: AreaCondition[] = ["critical", "low", "stable", "surplus", "stale"];

interface KurramMapProps {
  /**
   * "status": the dashboard's map, one severity pin per area, each linking to its card.
   * "place": the About page's map, the geography of the problem: towns, the one road and its closed ends.
   */
  variant?: "status" | "place";
  summaries?: AreaSummary[];
  title: string;
  caption: string;
  className?: string;
  style?: CSSProperties;
}

export function KurramMap({ variant = "status", summaries = [], title, caption, className = "", style }: KurramMapProps) {
  const { t, tArea } = useT();
  const titleId = `map-title-${variant}`;
  const pins =
    variant === "status"
      ? summaries.filter(({ area }) => PLACEMENTS[area.name])
      : PLACE_ORDER.map((name) => ({ area: { name }, condition: null }));

  return (
    <figure aria-labelledby={titleId} className={`card-routine ${className}`} style={style}>
      <figcaption>
        <h2 id={titleId} className="text-lead text-text-primary">
          {title}
        </h2>
        <p className="mt-1 text-caption text-text-secondary">{caption}</p>
      </figcaption>

      {/* Geography doesn't mirror in RTL, so the map keeps a left-to-right layout. */}
      <div dir="ltr" className={`relative mt-4 ${variant === "place" ? "mx-auto max-w-3xl" : ""}`}>
        {/* The status map's pins are links, so only the place map is announced as a single image. */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role={variant === "place" ? "img" : undefined}
          aria-labelledby={titleId}
        >
          <path d={DISTRICT} fill="var(--color-map-land)" stroke="var(--color-map-edge)" />
          <path d={BORDER} fill="none" stroke="var(--color-map-road)" strokeWidth={1.2} strokeDasharray="4 3" />

          <g fill="none" stroke="var(--color-map-road)" strokeLinecap="round">
            {/* On the About map the one road out is the point, so it's drawn heavier. */}
            <path d={MAIN_ROAD} strokeWidth={variant === "place" ? 4 : 3} />
            <path d={PEWAR_ROAD} strokeWidth={2} />
            <path d={KHARLACHI_ROAD} strokeWidth={2} />
          </g>

          <ClosedMarker {...KHARLACHI} />
          <ClosedMarker {...THALL} />

          {pins.map(({ area, condition }) => {
            const place = PLACEMENTS[area.name];
            if (condition === null) {
              // A town, not a status: a plain dot, with Parachinar (the city) drawn larger.
              const city = area.name === "Parachinar City Center";
              return (
                <circle
                  key={area.name}
                  cx={place.x}
                  cy={place.y}
                  r={city ? 7 : 5}
                  fill="var(--color-text-secondary)"
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              );
            }
            const label = `${tArea(area.name)}: ${t(`status.${condition}`)}`;
            return (
              <a key={area.name} href={`#${areaAnchorId(area.name)}`} aria-label={label} className="group outline-none">
                <title>{label}</title>
                <g transform={`translate(${place.x} ${place.y})`}>
                  <circle r={15} fill="transparent" />
                  <circle
                    r={13}
                    fill="none"
                    stroke="var(--color-focus)"
                    strokeWidth={2}
                    className="opacity-0 group-focus-visible:opacity-100"
                  />
                  <PinGlyph condition={condition} />
                </g>
              </a>
            );
          })}
        </svg>

        <MapLabel x={112} y={24} tone="muted">
          {t("dashboard.map.border")}
        </MapLabel>
        <MapLabel x={4} y={126} tone="closed" wrap>
          {t("dashboard.map.kharlachi")}
        </MapLabel>
        <MapLabel x={354} y={238} anchor="end" tone="closed">
          {t("dashboard.map.thallRoad")}
        </MapLabel>
        {pins.map(({ area }) => {
          const { x, y, label } = PLACEMENTS[area.name];
          return (
            // On the status map each pin's link already names the area, so the label is visual only.
            <MapLabel key={area.name} x={x + label.dx} y={y + label.dy} anchor={label.anchor} hidden={variant === "status"}>
              {tArea(area.name)}
            </MapLabel>
          );
        })}
      </div>

      {variant === "status" && (
        <ul aria-label={t("dashboard.map.legend")} className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-caption text-text-secondary">
          {LEGEND.map((condition) => (
            <li key={condition} className="inline-flex items-center gap-2">
              <svg viewBox="-11 -11 22 22" className="size-4" aria-hidden>
                <PinGlyph condition={condition} />
              </svg>
              {t(`status.${condition}`)}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
