"use client";

import type { ReactNode } from "react";
import { areaAnchorId, type AreaSummary } from "@/lib/dashboard";
import { conditionColor, type AreaCondition } from "@/lib/severity";
import { useT } from "@/lib/useT";

interface PinPlacement {
  x: number;
  y: number;
  /** Label offset from the pin, in map units. */
  labelDx: number;
  labelDy: number;
}

// Stylized positions strung along the Thall–Parachinar road. Illustrative, not geographic.
const PLACEMENTS: Record<string, PinPlacement> = {
  Pewar: { x: 66, y: 50, labelDx: 14, labelDy: 4 },
  "Parachinar City Center": { x: 108, y: 94, labelDx: 12, labelDy: -12 },
  Alizai: { x: 168, y: 120, labelDx: 12, labelDy: -10 },
  Balishkhel: { x: 212, y: 148, labelDx: 12, labelDy: -9 },
  Sadda: { x: 252, y: 172, labelDx: 14, labelDy: 4 },
  Bagan: { x: 292, y: 198, labelDx: 12, labelDy: -9 },
};

const DISTRICT =
  "M34 106 C 38 66 56 32 104 18 C 160 4 222 42 266 88 C 304 128 346 170 352 212 C 356 238 326 240 294 230 C 246 216 200 192 152 168 C 104 144 36 152 34 106 Z";
const BORDER = "M14 198 L 26 148 L 34 106 L 42 72 L 60 36 L 104 16 L 170 10";
const MAIN_ROAD =
  "M108 94 C 134 102 150 114 168 120 S 198 140 212 148 S 238 166 252 172 S 280 192 292 198 S 326 214 342 220";
const PEWAR_ROAD = "M108 94 Q 84 74 66 50";
const KHARLACHI_ROAD = "M108 94 Q 70 92 34 106";

const GLYPHS: Record<Exclude<AreaCondition, "stale">, ReactNode> = {
  critical: (
    <>
      <rect x={-1.3} y={-5.2} width={2.6} height={6.4} rx={1.2} fill="#fff" />
      <circle cy={3.9} r={1.4} fill="#fff" />
    </>
  ),
  low: <rect x={-4.5} y={-1.3} width={9} height={2.6} rx={1.2} fill="#1a1a19" />,
  stable: (
    <path d="M-4 0.3 L-1.3 3 L4 -2.6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  ),
  surplus: <path d="M0 -4.5 V4.5 M-4.5 0 H4.5" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />,
};

/** A status pin drawn at the origin. Each status has its own glyph, so color is never the only cue. */
function PinGlyph({ condition }: { condition: AreaCondition }) {
  if (condition === "stale") {
    return (
      <g>
        <circle r={9} fill="var(--surface)" stroke="var(--stale)" strokeWidth={2} strokeDasharray="3 2.2" />
        <path d="M0 -4.5 V0 L3 2" fill="none" stroke="var(--stale-ink)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  // Critical pins are drawn larger, so the most urgent places dominate the map.
  return (
    <g transform={condition === "critical" ? "scale(1.25)" : undefined}>
      <circle r={9} fill={conditionColor(condition)} stroke="var(--surface)" strokeWidth={2} />
      {GLYPHS[condition]}
    </g>
  );
}

function ClosedMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <circle r={7} fill="var(--critical)" stroke="var(--surface)" strokeWidth={2} />
      <path d="M-2.6 -2.6 L2.6 2.6 M2.6 -2.6 L-2.6 2.6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

function MapLabel({ x, y, children, anchor = "start", tone = "strong" }: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "end";
  tone?: "strong" | "muted";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      stroke="var(--surface)"
      strokeWidth={3}
      strokeLinejoin="round"
      style={{ paintOrder: "stroke" }}
      className={tone === "strong" ? "fill-ink text-[10.5px] font-semibold" : "fill-muted text-[9.5px]"}
    >
      {children}
    </text>
  );
}

const LEGEND: AreaCondition[] = ["critical", "low", "stable", "surplus", "stale"];

export function KurramMap({ summaries }: { summaries: AreaSummary[] }) {
  const { t, tArea } = useT();

  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption>
        <h2 id="map-title" className="text-sm font-semibold text-ink">
          {t("dashboard.map.title")}
        </h2>
        <p className="mt-0.5 text-xs text-muted">{t("dashboard.map.caption")}</p>
      </figcaption>

      {/* Geography doesn't mirror in RTL, so the map keeps a left-to-right layout. */}
      <svg viewBox="0 0 360 250" className="mt-3 h-auto w-full" style={{ direction: "ltr" }} aria-labelledby="map-title">
        <path d={DISTRICT} fill="var(--land)" stroke="var(--land-line)" />
        <path d={BORDER} fill="none" stroke="var(--road)" strokeWidth={1.2} strokeDasharray="4 3" />
        <MapLabel x={112} y={28} tone="muted">
          {t("dashboard.map.border")}
        </MapLabel>

        <g fill="none" stroke="var(--road)" strokeLinecap="round">
          <path d={MAIN_ROAD} strokeWidth={3} />
          <path d={PEWAR_ROAD} strokeWidth={2} />
          <path d={KHARLACHI_ROAD} strokeWidth={2} />
        </g>

        <ClosedMarker x={34} y={106} />
        <MapLabel x={14} y={128} tone="muted">
          {t("dashboard.map.kharlachi")}
        </MapLabel>
        <ClosedMarker x={342} y={220} />
        <MapLabel x={352} y={244} anchor="end" tone="muted">
          {t("dashboard.map.thallRoad")}
        </MapLabel>

        {summaries.map(({ area, condition }) => {
          const place = PLACEMENTS[area.name];
          if (!place) return null;
          const label = `${tArea(area.name)}: ${t(`status.${condition}`)}`;
          return (
            <a key={area.name} href={`#${areaAnchorId(area.name)}`} aria-label={label} className="group outline-none">
              <title>{label}</title>
              <g transform={`translate(${place.x} ${place.y})`}>
                <circle r={15} fill="transparent" />
                <circle
                  r={13}
                  fill="none"
                  stroke="var(--focus)"
                  strokeWidth={2}
                  className="opacity-0 group-focus-visible:opacity-100"
                />
                {condition === "critical" && (
                  <circle
                    r={11}
                    fill="var(--critical)"
                    opacity={0.45}
                    className="motion-safe:animate-ping"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                )}
                <PinGlyph condition={condition} />
              </g>
              <MapLabel x={place.x + place.labelDx} y={place.y + place.labelDy}>
                {tArea(area.name)}
              </MapLabel>
            </a>
          );
        })}
      </svg>

      <ul aria-label={t("dashboard.map.legend")} className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-ink-2">
        {LEGEND.map((condition) => (
          <li key={condition} className="inline-flex items-center gap-1.5">
            <svg viewBox="-11 -11 22 22" className="size-4" aria-hidden>
              <PinGlyph condition={condition} />
            </svg>
            {t(`status.${condition}`)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
