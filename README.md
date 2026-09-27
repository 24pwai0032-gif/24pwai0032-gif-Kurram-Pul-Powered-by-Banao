# Kurram Pul

When the road to Parachinar closes, Kurram Pul tells responders who needs what, how urgently, who can help nearby, and how soon it might happen again.

Built for the Banao Imaginathon (Health, Parachinar, Kurram District). Full spec: [SPEC.md](SPEC.md).

## What it does

During a Parachinar closure, phone and internet service break down along with supply. Every part is built to keep working in that situation, not just in the best case.

- **Shortage dashboard.** Supply reports from six areas, each marked by who verified it (a jirga elder, a facility record, an Edhi coordinator) and how recent it is. An area that has gone quiet is flagged as a blind spot. An AI summary gives a responder a 30-second read.
- **Triage assistant.** Someone describes a patient and gets an urgency level (critical, needs supplies, routine) and a next step. A chat mode works over full connectivity; a plain-text SMS mode works when mobile data is down. Each case is logged to the dashboard.
- **Surplus matcher.** Spare stock in one area is matched to shortages nearby: same-day fixes that don't wait for the road to reopen. Needs that no other area can cover are listed separately.
- **Closure-risk forecaster.** An estimate of the risk of a new closure, from past closures and current signals, with a stock-up recommendation, so hospitals prepare before the road shuts.
- **About this crisis.** The 2024–25 closure the app is modeled on, why the road and the phones fail together, and why jirga elders verify reports, each fact with its news source. It opens by itself on a first visit.

A sidebar (a drawer on phones) reaches every section from anywhere, with live counts: critical shortages, matches found, cases logged, current closure risk. The whole interface, including the AI's answers, works in English, Urdu and Pashto, with right-to-left layout for Urdu and Pashto.

## Run it locally

Needs Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # then set LLM_PROVIDER and that provider's API key
npm run dev                  # http://localhost:3000
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`. The build needs no API key.

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
- **SMS mode is a simulated gateway.** It shows exactly what an SMS reply would say, with the real message count, but no SMS is sent or received.
- **"Flagged for air ambulance / Edhi" is display only.** Nothing is dispatched. The Edhi ambulance number (115) is shown as text, not a tap-to-call link, so testers can't call it by accident.
- **No database.** Triage cases logged in the app live in the browser tab; reloading the page resets to the seed data.
- **Not a doctor.** The triage assistant is a prototype and says so at all times.

## Deploying (Vercel)

1. Push the repository to GitHub. `.env.local` is git-ignored and never leaves your machine.
2. In Vercel, import the repository. It detects Next.js; keep the default build settings.
3. Under Settings → Environment Variables, add `LLM_PROVIDER` and the matching key (`OPENAI_API_KEY` or `GROK_API_KEY`).
4. Deploy. Open the link in a private window and click through all five sections, in English and Urdu.

Before sharing the link publicly: the AI routes need no login, so anyone with the link spends your API credits. Set a monthly budget on the OpenAI project (or the xAI team) and rotate the key after the event. The routes accept only POST requests with size-limited input.

## How it's built

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Zustand · Zod · OpenAI SDK · react-markdown · lucide-react.

| Path | What it holds |
|---|---|
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
| `data/` | Simulated data: supply reports, verification tags, closure history |

### Conventions

- **Seed timestamps are relative.** `SEED_AS_OF` in `lib/seed.ts` is the moment the seed timestamps were written against; on load every timestamp shifts so it becomes "now".
- **Prompts stay verbatim, in the reader's language.** Each spec prompt is kept word for word; the route sends its instructions as the system message and the data as the user message, so text inside a report can't act as an instruction. In Urdu or Pashto, one line is appended asking for the answer in that language ([lib/ai/language.ts](lib/ai/language.ts)); the fields the app reads (triage tiers, JSON keys, supply names, the forecast's `risk_level` line) stay in English.
- **Stale = older than 12 hours** (`lib/staleness.ts`). A stale report stays visible, grayed out, and an area with only stale reports is flagged as a blind spot.
- **Severity is never color alone.** Every badge and map pin has an icon or glyph plus a label; colors are tokens in `app/globals.css` (light and dark). One scheme across all four sections:

  | Color | Supply status | Triage tier | Closure risk | Signal strength |
  |---|---|---|---|---|
  | Red | critical | critical | high | serious |
  | Amber | low | needs supplies | elevated | moderate |
  | Green | stable | routine | low | |
  | Gray | stale | | | minor |
  | Blue | surplus | | | |

  The top of every scale is a solid red chip; everything else is a tinted one. Critical items also carry more weight: larger bold badges, a thicker edge and tinted header on critical area, match and triage cards, bolder report rows, a critical stat tile that spans its row, and larger map pins. Risk levels always read as "High risk" and signal strengths use different words ("Serious", "Minor"), so neither is confused with a stock level of "Low".
- **Dates come from `messages/`, not `Intl`.** Browsers ship no Pashto date data and fall back to English, so month names are translated strings (`formatDate` in `lib/i18n.ts`).
- **RTL:** use logical Tailwind utilities (`ms-`, `pe-`, `border-s`, `start-`) instead of left/right. Interpolated values are wrapped in bidi isolation marks, so English names inside Urdu sentences don't scramble word order.
- **Adding a string:** add the key to all three files in `messages/`. A key missing from Urdu or Pashto is a type error.
- **Seed text is translated too.** Area and supply names, reporters and verifiers (`names`), and the forecast signals and closure causes (`events`) have Urdu and Pashto entries in `messages/`, keyed by the English text in `data/`. A value with no entry shows as written.

## Look and feel

Calm and clinical, warm without ornament. The colors come from the valley rather than from a UI kit: river-stone grey for the page, limestone for cards, a deodar-forest sidebar, walnut for the logo only. The district map is the one picture of the place. Status colors are deliberately plain so red always means the same thing.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--page` | `#ebebe3` | `#121614` | Page ground (river stone) |
| `--surface` | `#f8f7f2` | `#1b201e` | Cards (limestone) |
| `--ink` / `--muted` | `#1c211f` / `#5f6661` | `#ecebe4` / `#98a09a` | Text: 15.2:1 and 5.5:1 on cards |
| `--side` | `#1e2b27` | `#0e1412` | Sidebar and drawer (deodar) |
| `--brand` | `#6b4a34` | `#a87650` | Logo mark only (walnut) |
| `--land` | `#d8dbc4` | `#262b22` | District on the map |
| `--critical` | `#b23b2a` | `#e0645a` | Critical / evacuate / high risk |
| `--low` | `#c98a2b` | `#d9a447` | Low stock / needs supplies / elevated |
| `--stable` | `#56823a` | `#5f9450` | Stable / routine / low risk |
| `--surplus` | `#3a67a0` | `#7196d6` | Surplus stock |
| `--stale` | `#c4c6be` | `#5a5f5b` | No recent update |

The five status colors are at least ΔE 16 apart for normal vision in both themes; for color-blind readers each also has its own icon and label.

Type: Noto Sans for English; Noto Naskh Arabic for Urdu and Pashto interface text; Noto Nastaliq Urdu for Urdu headings and reading text (the About panel, AI answers, triage reasons, forecast signals), which is how Urdu is normally printed. Pashto stays in Naskh, its usual script style. Any English inside Urdu text keeps Noto Sans.

## How it fits Kurram

This formalizes coordination that already happens. Pharmacy owners, DHQ Hospital staff and Edhi Foundation coordinators already share stock news by phone and WhatsApp during closures. The app makes that structured and visible, and adds what informal coordination can't do well: matching surplus to shortages across areas in real time. Trust comes from structures that already exist in Kurram: reports verified by named jirga elders and facility records rather than anonymous crowdsourcing.

## Credits

- Built with Claude Code (Anthropic) as the coding assistant.
- AI features run on OpenAI (`gpt-6-luna` by default) or xAI Grok, switchable with `LLM_PROVIDER`.
- Fonts: Noto Sans, Noto Naskh Arabic, Noto Nastaliq Urdu. Icons: Lucide.
