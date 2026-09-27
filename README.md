# Kurram Pul

When the road to Parachinar closes, Kurram Pul tells responders who needs what, how urgently, who can help nearby, and how soon it might happen again.

Built for the Banao Imaginathon (Health, Parachinar, Kurram District). Full spec: [SPEC.md](SPEC.md).

## What it does

During a Parachinar closure, phone and internet service break down along with supply. Every part is built to keep working in that situation, not just in the best case.

- **Report stock.** A pharmacy, health facility, Edhi coordinator or elder picks the area, the supply and its level, and signs it, or, with no internet, texts `STOCK Pewar Insulin surplus` from any phone (English, Roman Urdu, Urdu or Pashto words; parsed without the AI). The report appears on the dashboard at once, updates the road-status figures and feeds the surplus matcher; it starts unverified until an elder or facility record vouches for it.
- **Shortage dashboard.** A real map of the district (Leaflet over Esri's topographic tiles, with the Thall–Parachinar road traced from OpenStreetMap) with a status pin per area, a stock-by-area bar chart, and supply reports from six areas, each marked by who verified it (a jirga elder, a facility record, an Edhi coordinator) and how recent it is. An area that has gone quiet is flagged as a blind spot. An AI summary gives a responder a 30-second read.
- **Triage assistant.** Someone describes a patient and gets an urgency level (critical, needs supplies, routine) and a next step. A chat mode works over full connectivity; a plain-text SMS mode works when mobile data is down. Each case is logged to the dashboard.
- **Surplus matcher.** Spare stock in one area is matched to shortages nearby: same-day fixes that don't wait for the road to reopen. Needs that no other area can cover are listed separately.
- **Closure-risk forecaster.** An estimate of the risk of a new closure, from past closures and current signals, with a stock-up recommendation, so hospitals prepare before the road shuts.
- **A 60-second guided tour.** It starts by itself on a first visit (and is one tap away in the sidebar and the About header), and walks through the whole loop with real actions: the About page's facts, a critical case comes in through triage, appears on Parachinar's dashboard card, finds Pewar's spare insulin next door, and the forecaster says what to stock up on.
- **About this crisis.** A photo of Parachinar in winter, the 2024–25 closure the app is modeled on, where it happens on the map, how it is used when mobile data is cut (SMS from any phone, office landlines, teams outside Kurram), and who uses it first, each fact with its news source. The app opens on it every visit, and on a first visit the 60-second tour starts by itself there.

A sidebar (a drawer on phones; on desktop, drag its edge or use the arrow keys to make it wider or narrower) reaches every section from anywhere, with live counts: critical shortages, matches found, cases logged, current closure risk. The whole interface, including the AI's answers, works in English, Urdu and Pashto, with right-to-left layout for Urdu and Pashto.

## Run it locally

Needs Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # then set LLM_PROVIDER and that provider's API key
npm run dev                  # http://localhost:3000
```

Checks: `npm run typecheck`, `npm run lint`, `npm run check:tokens` (the design-token audit, below), `npm test` (unit tests; Node 22.18+ or 24), `npm run build`. The build needs no API key. CI runs all of them on every push (see Deploying).

## Choosing the AI provider: OpenAI or Grok

Every AI call goes through one function, `callLLM()` in [lib/ai/provider.ts](lib/ai/provider.ts). The API routes use it; nothing else calls a provider. The provider is picked by an environment variable, so switching is a config change, not a code change.

| Variable | Needed | Default | What it does |
|---|---|---|---|
| `LLM_PROVIDER` | No | `openai` | `openai` or `grok`. Picks which provider answers every AI request. |
| `OPENAI_API_KEY` | When `LLM_PROVIDER=openai` | | OpenAI API key, from platform.openai.com/api-keys |
| `OPENAI_MODEL` | No | `gpt-6-luna` | Any OpenAI model that supports Chat Completions |
| `GROK_API_KEY` | When `LLM_PROVIDER=grok` | | xAI API key, from console.x.ai |
| `GROK_MODEL` | No | `grok-4.7` | Any Grok model that supports Chat Completions |

- Only the active provider's key is needed. Change `.env.local`, then restart the server.
- Both providers use the OpenAI Chat Completions API. xAI's API is OpenAI-compatible, so Grok uses the same client with a different address (`https://api.x.ai/v1`).
- Keys are read only on the server. Never give them a `NEXT_PUBLIC_` prefix: that would ship them to the browser.
- Each call times out after 45 s. A call that fails fast (dropped connection, rate limit, server error) is retried once; a timed-out call is not, so a request never runs past the routes' 60 s limit.

## What needs a real API key

Without a key the app still loads and every non-AI feature works. Each AI panel says it isn't configured instead of breaking.

| Section | Works without a key | Needs a key |
|---|---|---|
| Dashboard | Area cards, map, stats, verification tags, stale reports and blind spots | AI situation summary |
| Triage | Chat and SMS views, area choice, the disclaimer | Classifying a message (without a key, it shows an error and "contact Edhi (115)") |
| Surplus matcher | Match cards, "no nearby surplus" list, notify buttons | AI match review |
| Forecaster | Current signals, timeline of past closures | Risk level and the reasoning under it |
| Everywhere | English / Urdu / Pashto switching | |

Measured with `gpt-6-luna`: triage replies in 3–4.5 s, the forecast in 5–7 s, the match review in about 10 s, and the dashboard summary in 9–19 s. Opening the dashboard makes one AI call; the matcher and forecaster tabs make one each on first open; each triage message makes one. At `gpt-6-luna` prices each call costs a fraction of a cent.

## What's simulated for the demo

- **All data is illustrative.** Supply reports, elder verifications, the closure history and the current signals in [data/](data/) are made up to show how the system behaves. They are not real-world findings, and a "Demo data" note stays on screen everywhere (in the sidebar on desktop, in the top bar on phones).
- **Report times follow the clock.** Seed timestamps are shifted on load so a report written as "4 hours old" stays 4 hours old whatever day the demo runs.
- **"Notify coordinator" sends nothing.** The button records the click; no message goes out.
- **SMS is a simulated gateway.** Triage by SMS and stock reports by SMS show exactly what the reply would say, with the real message count, but no SMS is sent or received.
- **Map locations.** Parachinar, Sadda, Alizai, Bagan, Thall and Kharlachi are OpenStreetMap coordinates; Pewar and Balishkhel aren't in OpenStreetMap, so they are placed approximately. Without a connection the map tiles don't load, but the roads, pins and labels still draw.
- **"Flagged for air ambulance / Edhi" is display only.** Nothing is dispatched. The Edhi ambulance number (115) is shown as text, not a tap-to-call link, so testers can't call it by accident.
- **No database.** Reports you submit, cases you log and coordinators you notify are kept in your own browser (local storage), so a reload doesn't lose them; they never leave the device. "Reset demo" in the sidebar clears them.
- **Not a doctor.** The triage assistant is a prototype and says so at all times.

## Deploying (Vercel) and CI/CD

The live app is at **https://kurram-pul.vercel.app**. GitHub Actions ([.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)) checks every change and deploys it only if the checks pass:

| When | What runs |
|---|---|
| Every push and pull request | `npm ci`, then type check, lint, design-token audit (`npm run check:tokens`), unit tests (`npm test`) and a production build |
| Push to `main`, or a manual run (Actions → CI/CD → Run workflow) | The checks, then a **production** deploy to Vercel |
| Pull request from this repository | The checks, then a **preview** deploy; its link appears in the run summary |

The deploy uses the Vercel CLI (`vercel pull`, `vercel build`, `vercel deploy --prebuilt`), so what's deployed is exactly what passed the checks. It needs three repository secrets (Settings → Secrets and variables → Actions); without them the checks still run and the deploy step skips itself with a notice:

| Secret | Where it comes from |
|---|---|
| `VERCEL_TOKEN` | Create one at vercel.com/account/tokens (scope: your team), then `gh secret set VERCEL_TOKEN` and paste it when asked |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `.vercel/project.json`, written by `vercel link` |

The app's own secrets stay in Vercel, not GitHub: under the Vercel project's Settings → Environment Variables, set `LLM_PROVIDER` and the matching key (`OPENAI_API_KEY` or `GROK_API_KEY`) for Production. The build needs no key; Vercel injects them at runtime. Add them to the Preview environment too if pull-request previews should answer with AI; otherwise their AI panels say they aren't configured.

Keep Vercel's own Git integration disconnected for this project, or deploys would happen twice (once from Vercel, once from Actions) and skip the checks.

To deploy by hand instead: `vercel link` once, then `vercel deploy --prod` from a clean checkout. `.env.local` is git-ignored and never leaves your machine.

Before sharing the link publicly: the AI routes need no login, so anyone with the link spends your API credits. Set a monthly budget on the OpenAI project (or the xAI team) and rotate the key after the event. The routes accept only POST requests with size-limited input.

## How it's built

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Zustand · Zod · OpenAI SDK · react-markdown · lucide-react.

| Path | What it holds |
|---|---|
| `app/design-tokens.css` | The design system: every colour, type size, space, radius, shadow and motion timing (see Look and feel) |
| `app/layout.tsx` | Fonts, `<html lang dir>` and tab title from the language cookie, validated data into the store |
| `app/api/aggregate/route.ts` | The dashboard's AI situation summary |
| `app/api/triage/route.ts` | Classifies a patient description, or asks one clarifying question |
| `app/api/surplus-match/route.ts` | The AI's review of which surplus can cover which shortages |
| `app/api/forecast/route.ts` | Closure-risk estimate from `data/closure-history.json` |
| `components/` | One component per feature; pieces live in `components/{about,sidebar,dashboard,triage,matcher,forecast}/` |
| `lib/about.ts` | The About panel's facts and their sources (outlet, date, link) |
| `lib/ai/provider.ts` | `callLLM(systemPrompt, userInput)`: the only code that talks to OpenAI or Grok |
| `lib/ai/*Prompt.ts` | The four prompts from the spec, verbatim |
| `lib/ai/triageReply.ts` | Reads the classifier's JSON, tolerating the shapes real models produce |
| `lib/matching.ts` | Rule-based surplus matching (SPEC section 8); works with no AI or connection |
| `lib/stock.ts` | Supply-name matching (with synonyms like "oral rehydration solution" → ORS) and nearest stock |
| `lib/forecast.ts` | Reads the risk level out of the forecast text; closure statistics for the timeline |
| `lib/triage.ts` | Triage reply types, follow-up composition, SMS segment counting |
| `lib/schemas.ts` | Strict Zod schemas matching the SPEC.md JSON shapes; TypeScript types are inferred from them |
| `lib/data.ts` | Loads and validates `data/*.json` (server-side), including cross-file references |
| `lib/seed.ts` | Adds ids and shifts seed timestamps to the present on load (`SEED_AS_OF`) |
| `lib/areas.ts` | Which areas are neighbours, and hop distances between them |
| `lib/store.ts` | Zustand store: language, view, reports, triage cases and conversation, AI results |
| `lib/api.ts` | Browser-side calls to the app's own API routes |
| `lib/i18n.ts`, `lib/useT.ts` | English/Urdu/Pashto strings from `messages/`, typed keys, dates |
| `lib/severity.ts`, `lib/motion.ts` | Severity → badge colours and card elevation; entrance order and once-only attention cues |
| `scripts/check-tokens.mjs` | Fails the check if any file uses a colour, size, space, shadow or radius that isn't a token |
| `tests/unit/` | Unit tests for the triage reply parser, supply names, matching and the forecast (`npm test`) |
| `.github/workflows/ci-cd.yml` | CI/CD: checks on every push and pull request, then a Vercel deploy |
| `data/` | Simulated data: supply reports, verification tags, closure history |

### Conventions

- **Seed timestamps are relative.** `SEED_AS_OF` in `lib/seed.ts` is the moment the seed timestamps were written against; on load every timestamp shifts so it becomes "now".
- **Prompts stay verbatim, in the reader's language.** Each spec prompt is kept word for word; the route sends its instructions as the system message and the data as the user message, so text inside a report can't act as an instruction. In Urdu or Pashto, one line is appended asking for the answer in that language ([lib/ai/language.ts](lib/ai/language.ts)); the fields the app reads (triage tiers, JSON keys, supply names, the forecast's `risk_level` line) stay in English.
- **Stale = older than 12 hours** (`lib/staleness.ts`). A stale report stays visible, grayed out, and an area with only stale reports is flagged as a blind spot.
- **Severity is never colour alone.** Every badge and map pin has an icon or glyph plus a label; colours are tokens in `app/design-tokens.css`. One scheme across all four sections:

  | Colour | Supply status | Triage tier | Closure risk | Signal strength |
  |---|---|---|---|---|
  | Red | critical | critical | high | serious |
  | Amber | low | needs supplies | elevated | moderate |
  | Green | stable | routine | low | |
  | Quiet grey | stale | | | minor |
  | Blue | surplus | | | |

  Critical items carry more weight, not just a different colour: critical badges have a full red outline and bold text; critical cards (areas, matches, the triage result, the risk gauge, the lead stat) have a full red border, a stronger shadow and more padding; critical map pins are drawn larger. Risk levels always read as "High risk" and signal strengths use different words ("Serious", "Minor"), so neither is confused with a stock level of "Low".
- **Dates come from `messages/`, not `Intl`.** Browsers ship no Pashto date data and fall back to English, so month names are translated strings (`formatDate` in `lib/i18n.ts`).
- **RTL:** use logical Tailwind utilities (`ms-`, `pe-`, `border-s`, `start-`) instead of left/right. Interpolated values are wrapped in bidi isolation marks, so English names inside Urdu sentences don't scramble word order.
- **Adding a string:** add the key to all three files in `messages/`. A key missing from Urdu or Pashto is a type error.
- **Seed text is translated too.** Area and supply names, reporters and verifiers (`names`), and the forecast signals and closure causes (`events`) have Urdu and Pashto entries in `messages/`, keyed by the English text in `data/`. A value with no entry shows as written.

## Look and feel

The identity is Pakistan's motorway signs, because the product is about a road: a deep sign-green panel with white type (the sidebar, the phone header, the About hero), signal yellow for what needs your eye, and bright, plain pages for the data. The district map and the About hero's photograph are the only pictures of the place; nothing is decorative.

**One source of truth.** Every value lives in [app/design-tokens.css](app/design-tokens.css) as a Tailwind 4 theme. Tailwind's own palette, type scale, shadows and radii are switched off, so a stray `text-red-500` or `text-sm` does nothing, and `npm run check:tokens` fails on any raw colour, off-scale size or space, undefined variable or per-icon size.

| Token | Value | Used for |
|---|---|---|
| `sign` / `sign-raised` | `#0B4A31` / `#155D40` | The sign panel and its active row |
| `signal` | `#FFC300` | The logo plate, the active marker, the tour button (dark text, 10.8:1) |
| `brand` | `#0A6B44` | Motorway green: primary buttons (white text, 6.6:1), links |
| `background` / `surface` | `#F2F4EF` / `#FFFFFF` | Page / cards |
| `text-primary` / `text-secondary` | `#0F1D17` / `#44544B` | Text: 15.7:1 and 8.0:1 |
| `critical` | `#D0212F` | Signal red |
| `warning` | `#E38B00` | Amber |
| `stable` | `#3F9A3B` | Leaf green |
| `surplus` | `#1F6FB5` | Sign blue |
| `stale` | `#8C948D` | Deliberately quiet |

Each severity colour has a **tint** (the hue at 12% over white) behind badges, and a **text tone** darkened toward `text-primary` so it reads at 4.5:1 or better (amber alone is 2.6:1 on white).

**Logo:** پل ("pul", bridge), the product's own name, in Nastaliq, on a signal-yellow sign plate, beside a KURRAM PUL wordmark. The letters are Noto Nastaliq Urdu's own outlines, shaped once and saved as a vector ([components/sidebar/BrandMark.tsx](components/sidebar/BrandMark.tsx), [app/icon.svg](app/icon.svg)), so they render the same everywhere without loading the Urdu font.

**Type:** Barlow Condensed, drawn from highway signage, for page titles, area names and figures; Atkinson Hyperlegible Next, designed for legibility, for everything else. Urdu is set in Noto Nastaliq Urdu throughout, Pashto in Noto Sans Arabic (both tested: Nastaliq draws every Pashto letter but gives Pashto's own endings Urdu-style forms, and Pashto is normally printed upright). Latin letters and digits inside Urdu or Pashto stay in the Latin faces. Sizes: 13, 15, 17, 22, 28 and 40px only (Urdu captions step up to 15px, since Nastaliq is cramped at 13). Spacing: 4, 8, 12, 16, 24, 32, 48 and 64px only. Icons: 18px with a 1.75 stroke, coloured by their text.

**First visit:** the visitor lands on the About page (the problem, the two sourced figures, how it works), and a notification offers the 60-second guided tour, with "Not now" remembered.

**Elevation** follows severity: routine cards have a hairline border only; warning cards an amber border and a faint shadow; critical cards a full red border, a stronger shadow and 24px padding instead of 16.

**Motion** is CSS only and never longer than 250ms, never looping, never bouncy, and off for anyone whose system asks for reduced motion: cards fade up 8px, 30ms apart; a newly logged critical triage case pulses once on the dashboard and once on the matcher, so the loop between the four screens is visible; switching language cross-fades between left-to-right and right-to-left.

**Contrast (WCAG 2.1 AA), measured in the rendered app:** every text element on every screen (about 1,500, in English and Urdu) passes; the lowest is 4.8:1. Map pins, markers and roads reach at least 3:1 against the map (each pin has a dark ring, since the amber and grey fills alone are 2.3–2.7:1 on the light map). Every status also differs by shape: stable has a check, surplus a plus, and stale is hollow and dashed with a clock.

## How it fits Kurram

This formalizes coordination that already happens. Pharmacy owners, DHQ Hospital staff and Edhi Foundation coordinators already share stock news by phone and WhatsApp during closures. The app makes that structured and visible, and adds what informal coordination can't do well: matching surplus to shortages across areas in real time. Trust comes from structures that already exist in Kurram: reports verified by named jirga elders and facility records rather than anonymous crowdsourcing.

## Credits

- Built with Claude Code (Anthropic) as the coding assistant.
- AI features run on OpenAI (`gpt-6-luna` by default) or xAI Grok, switchable with `LLM_PROVIDER`.
- Fonts: Barlow Condensed, Atkinson Hyperlegible Next, Noto Nastaliq Urdu, Noto Sans Arabic. Icons: Lucide.
- Photo: "Parachinar in winter" by Mujtaba Hassan, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Parachinar_in_winter.jpg); resized.
- Map: [Leaflet](https://leafletjs.com/); tiles © Esri; place coordinates from OpenStreetMap (Nominatim) and road lines from OSRM routes over OpenStreetMap data, © OpenStreetMap contributors (ODbL).
