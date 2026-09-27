#!/usr/bin/env node
// Design-token audit: fails if any component, style or helper uses a value that isn't a token
// from app/design-tokens.css. Run with `npm run check:tokens`.
//
// It flags:
//   - raw colours (hex, rgb(), hsl(), oklch()) anywhere but the token file
//   - var(--name) references to variables that no token defines
//   - Tailwind's default palette (red-500, gray-*, white, black…), type scale (text-sm, text-xl…),
//     shadows, radii, line heights and fonts, all of which the token file switches off
//   - spacing (padding, margin, gap) off the 4, 8, 12, 16, 24, 32, 48, 64px scale
//   - per-icon size or stroke overrides on lucide icons (every icon is 18px, set once)
//
// A line ending in `token-audit: allow` is skipped; use it only where a literal is unavoidable
// (the browser theme colour in app/layout.tsx, which can't read CSS variables).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TOKENS_FILE = join(ROOT, "app", "design-tokens.css");
const SCAN = ["app", "components", "lib"];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

// ── What the tokens define ────────────────────────────────────────────────────────────────
const tokenCss = readFileSync(TOKENS_FILE, "utf8");
const defined = new Set([...tokenCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
// Set at runtime rather than in the token file: font faces (app/layout.tsx), motion indices
// (lib/motion.ts), and Tailwind's own internals.
for (const v of ["--font-fraunces-face", "--font-inter-face", "--font-nastaliq-face", "--font-arabic-sans-face", "--rise-index", "--pulse-color"]) {
  defined.add(v);
}
const isDefined = (name) => defined.has(name) || name.startsWith("--tw-");

// ── Rules ─────────────────────────────────────────────────────────────────────────────────
const PALETTE = "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const COLOR_UTILS = "bg|text|border(?:-[xytblrse])?|divide|fill|stroke|ring|outline|from|via|to|decoration|placeholder|caret|accent|shadow";
const SPACE_UTILS = "p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy]";
const ALLOWED_STEPS = new Set(["0", "1", "2", "3", "4", "6", "8", "12", "16", "auto"]);
const B = "(?<![\\w-])"; // class boundary before
const E = "(?![\\w-])"; // class boundary after
const V = "(?:[a-z0-9-]+:)*"; // any variant prefixes (md:, hover:, rtl:…)

const RULES = [
  { name: "raw colour", re: /#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab)\(/g, skip: (m, line) => /href=|#\$\{/.test(line) && m[0].startsWith("#") && !/["'`]#[0-9a-f]{3,8}["'`]/i.test(line) },
  { name: "Tailwind default colour", re: new RegExp(`${B}${V}-?(?:${COLOR_UTILS})-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?:\\/\\d+)?${E}`, "g") },
  { name: "font size off the scale", re: new RegExp(`${B}${V}text-(?:xs|sm|base|lg|[2-9]?xl|\\[[^\\]]+\\])${E}`, "g") },
  { name: "default shadow", re: new RegExp(`${B}${V}shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner|\\[[^\\]]+\\])${E}`, "g") },
  { name: "default radius", re: new RegExp(`${B}${V}rounded(?:-[setblrxy]{1,2})?-(?:xs|xl|2xl|3xl|4xl|\\[[^\\]]+\\])${E}`, "g") },
  { name: "default line height", re: new RegExp(`${B}${V}leading-(?!nastaliq|arabic)[a-z0-9]+${E}`, "g") },
  { name: "default font", re: new RegExp(`${B}${V}font-(?:mono|serif)${E}`, "g") },
  { name: "default letter spacing", re: new RegExp(`${B}${V}tracking-(?!wide${E})[a-z0-9-]+${E}`, "g") },
  {
    name: "spacing off the scale",
    re: new RegExp(`${B}${V}-?(?:${SPACE_UTILS})-([0-9.]+|px|\\[[^\\]]+\\])${E}`, "g"),
    skip: (m) => ALLOWED_STEPS.has(m[1]) || (m[1].startsWith("[") && m[1].includes("--spacing(")),
  },
];

// ── Scan ──────────────────────────────────────────────────────────────────────────────────
const problems = [];
const files = SCAN.flatMap((d) => walk(join(ROOT, d))).filter((f) => f !== TOKENS_FILE);

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    if (line.includes("token-audit: allow")) return;
    // Comments describe tokens by value; only code counts.
    const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    if (/^\s*\*/.test(line)) return;
    for (const rule of RULES) {
      for (const m of code.matchAll(rule.re)) {
        if (rule.skip?.(m, code)) continue;
        problems.push(`${rel}:${i + 1}  ${rule.name}: ${m[0]}`);
      }
    }
    for (const m of code.matchAll(/var\((--[a-z0-9-]+)[),]/g)) {
      if (!isDefined(m[1])) problems.push(`${rel}:${i + 1}  undefined variable: ${m[1]}`);
    }
  });

  // Lucide icons take their size and stroke from the global .lucide rule (18px).
  const imp = text.match(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/);
  if (imp) {
    const names = [...imp[1].split(",").map((x) => x.trim()).filter((x) => x && !x.startsWith("type ")), "Icon"];
    for (const m of text.matchAll(new RegExp(String.raw`<(${names.join("|")})\b([^>]*?)/>`, "g"))) {
      if (/(?<![\w-])size-|strokeWidth=|\bsize=\{/.test(m[2])) {
        const lineNo = text.slice(0, m.index).split("\n").length;
        problems.push(`${rel}:${lineNo}  icon size override: <${m[1]}${m[2].slice(0, 60)}…/>`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Design-token audit: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n`);
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Design-token audit: ${files.length} files clean. Every colour, size, space, shadow and radius comes from app/design-tokens.css.`);
