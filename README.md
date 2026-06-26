# NBA Summer League × LiveX — Design Your Drop

> A fan hoodie-design experience for the 2026 NBA Summer League × LiveX collaboration: answer a few quick questions, and a deterministic engine designs a custom Summer League hoodie that's revealed on a photorealistic, rotatable 3D model — conformed to the fabric like real embroidery.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Tests](https://img.shields.io/badge/tests-vitest-6e9f18?logo=vitest)

Because the hoodies are physically manufactured, what the viewer shows is what gets made. The whole path — branded landing → six-step questionnaire → 3D reveal — sits on top of a **pure, fully-tested rules engine** and an **approved-catalog data model**.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Routes](#routes)
- [Project Structure](#project-structure)
- [How It Works — Logo Selection & Placement](#how-it-works--logo-selection--placement)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Brand](#brand)

## Features

- **Six-step questionnaire** — team(s), colorway, size, vibe, patch density, and optional must-have patches. Fans can also **rep the league** (Las Vegas Summer League / Summer League / NBA) instead of a single franchise.
- **Unisex sizing, all-ages content** — the garment is unisex (no gendered cut); fans pick Adult/Kid + a size. A **Kid** audience keeps the design all-ages by excluding adult-themed patches (alcohol / gambling / the Vegas-adult tagline). Size is an order detail and never changes the design.
- **Deterministic design engine** — identical answers always produce an identical `DesignSpec`. No randomness, no I/O, fully unit-tested.
- **Color-aware patch selection** — patches are contrast-checked against the fabric (WCAG) so nothing disappears, and "surprise" fillers are matched to the chosen team's palette.
- **Photorealistic 3D reveal** — every graphic is projected onto the GLB hoodie with `DecalGeometry` so it conforms to the curved fabric like embroidery, with an inner-shell occluder preventing back-logo bleed-through.
- **Cinematic landing page** — scroll-driven 3D hero, smooth scroll, choreographed act keyframes, video reels.
- **In-app assistant** — a bottom-right chatbot (OpenRouter) scoped to the NBA, the Summer League, LiveX, and this product, with a low-opacity Summer League gameplay backdrop during patch selection.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 (CSS `@theme` in `app/globals.css` — no config file) |
| 3D | three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing |
| Motion | GSAP (+ ScrollTrigger), Lenis smooth scroll |
| Validation | zod v4 |
| Testing | Vitest (node environment) |
| Assistant | OpenRouter (OpenAI-compatible, streaming) |

## Getting Started

### Prerequisites

- **Node.js 20+** and npm
- That's it to run the core app — all external integrations are optional (see [Configuration](#configuration)).

### Installation

```bash
git clone <repo-url>
cd livex_nba
npm install
cp .env.example .env.local   # optional — the app runs with everything unset
```

### Running

```bash
npm run dev       # dev server → http://localhost:3000
npm run build     # production build
npm start         # serve the built app
```

## Routes

| Route | What it is |
|---|---|
| `/` | Branded animated landing — scroll-driven 3D hero, video reels, CTA |
| `/design` | The six-step questionnaire → 3D reveal (the whole fan experience) |
| `/my-look` | Camera-based "my look" preview of a generated design |
| `/preview` | Dev-only sandbox for tuning the 3D viewer against any spec |
| `POST /api/generate` | `QuestionnaireAnswers` → `DesignSpec` (programmatic / parity testing) |
| `POST /api/chat` | Server proxy for the assistant — keeps the OpenRouter key server-side |

The chat widget is mounted globally, so it appears on every route.

## Project Structure

```
lib/engine/       — framework-free, pure, deterministic design engine
  generate.ts       → generate(answers) → DesignSpec (main entry point)
  harmony.ts        → isHarmonious(), contrastRatio(), paletteDistance()
  select.ts         → resolveBack(), densityBudget(), buildCandidates()
  zones.ts          → assignZones()
  rationale.ts      → buildRationale()
  schema.ts         → designSpecSchema (zod), checkInvariants(), DENSITY_MAX
  answers-schema.ts → zod schema for QuestionnaireAnswers

lib/catalog/      — data model: types, zones, graphic catalogs (full 33 / 94)
  types.ts          → Graphic, DesignSpec, QuestionnaireAnswers, PatchZone, …
  zones.ts          → PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS
  teams.ts          → TEAMS (30 franchises), FEATURE_OPTIONS (league/event back picks), FEATURED_PATCHES (must-haves)
  index.ts          → catalog arrays + lookup helpers (backById, teamPatch, …)

lib/three/        — 3D placement model
  zone-transforms.ts → ZONE_GLB: per-zone surface point + normal on the hoodie mesh

lib/landing/      — landing-page config, scroll state, act keyframes
lib/questionnaire/options.ts — vibe + density option metadata for the wizard

components/design/            — the fan-facing flow (client)
  DesignWizard.tsx  → six-step questionnaire; team step also offers league/event picks; size step sets Adult/Kid + unisex size; every step runs a low-opacity gameplay backdrop (BACKDROP_SRC)
  Reveal.tsx        → result screen: rotating 3D hoodie + design breakdown
  primitives.tsx    → shared UI (SelectTile, buttons, headings)

components/three/             — the 3D viewer
  HoodieViewer.tsx  → R3F canvas, studio lighting, turntable, OrbitControls
  HoodieGLB.tsx     → loads/bakes the GLB, recolors fabric, projects decals + occluder

components/landing/           — landing hero, smooth scroll, cursor, brand lockup
components/chat/ChatWidget.tsx — bottom-right streaming assistant

app/
  page.tsx          → branded landing
  design/page.tsx   → renders <DesignWizard /> (the whole experience)
  api/generate/route.ts → POST /api/generate → calls generate()
  api/chat/route.ts → POST /api/chat → OpenRouter proxy (server-only key)
  layout.tsx, globals.css → fonts + brand theme + global chat widget

lib/store/        — inert persistence seam (LocalJsonStore)
lib/curation/     — inert LLM curation seam
```

The engine is pure TypeScript with no I/O, so the wizard calls `generate(answers)` **directly on the client** — the reveal needs no server round-trip. `POST /api/generate` remains for programmatic/server use and parity testing.

## How It Works — Logo Selection & Placement

Turning five answers into a manufacturable design is two distinct problems: **selection** (*which* graphics) and **placement** (*where* they go, in the 2D spec and on the 3D garment). Every step is pure and deterministic — identical `QuestionnaireAnswers` always yield an identical `DesignSpec` (all tie-breaks sort by `id.localeCompare`; the engine never calls `Math.random`, `Date.now`, or does I/O).

### Data flow

```
QuestionnaireAnswers
  → resolveBack()       (picks hero back graphic)
  → buildCandidates()   (harmony-filtered placement candidates, deterministic)
  → assignZones()       (maps candidates to PATCH_ZONE_PRIORITY slots)
  → buildRationale()    (human-readable explanation string)
  → designSpecSchema.safeParse()  (zod validation)
  → checkInvariants()   (catalog IDs, unique zones, density cap, harmony)
  → DesignSpec
```

### 1. Selection — which graphics

**Back hero** (`resolveBack`, `lib/engine/select.ts`). The single back graphic is the identity anchor, so team identity wins outright:

1. If `teamsRanked[0]` is a **league/event "rep" option** (Las Vegas Summer League, Summer League, or NBA — see `FEATURE_OPTIONS`) its slug *is* a back-graphic id, so that graphic goes on the back directly. Fans who don't rep one franchise pick these in the team step.
2. Otherwise take the fan's #1 team and look up its official back logo via `teamBackGraphic(slug)`.
3. If there is no pick, fall back to the lowest-`id` Summer League / Vegas back graphic. (Every franchise has a back graphic; Chicago Bulls reuses its placement logo, since the source PDF has no dedicated Bulls back.)

The back hero is deliberately **not** harmony-filtered. Contrast-gating it would suppress real team logos (e.g. a dark logo on black), and the fan explicitly asked for that team — so it always goes on.

**Placement candidates** (`buildCandidates`). An *ordered* candidate list is assembled by descending intent. Each graphic is admitted at most once and only if it clears harmony (see below), so the list is de-duplicated and fabric-safe as it is built. **Team identity leads the design** — the teams the fan picked outrank the optional add-ons:

1. **Remaining ranked teams** — `teamPatch()` for `teamsRanked[1..]` (the #1 team already owns the back), in the fan's ranked order. **Team picks take priority**, so they claim the most prominent zones first (front chest, then upper back).
2. **Must-have add-ons** — the patches the fan pinned in the Extras step (`mustHaveIds`), **in their tap order**, placed after the team patches. The fan may pin as many as the density allows (see cap below).
3. **"Surprise" fillers** — `vegas` + `summer_league` identity patches and `fun` patches whose `mood[]` includes the chosen `vibe`, **ordered by colour affinity to the #1 pick** (`paletteDistance`, `lib/engine/harmony.ts`): the fillers whose palette best matches what the fan reps come first (e.g. a Lakers fan's surprises skew purple/gold; a Celtics fan's skew green), with a deterministic `id` tiebreak. A league/event pick uses that back graphic's palette as the colour reference; with nothing chosen, the distance is a constant so it falls back to a pure `id` sort.

**Placement is colour- and priority-aware; the placement *options* never change.** The ten patch zones are fixed (`PATCH_ZONE_PRIORITY`); only *which* candidate fills *which* zone is tuned — by candidate order. Because team patches lead, the recognizable marks land in the prominent zones (chest, upper back), and the colour-matched surprises fill the sleeves.

**Harmony is a hard invariant, not a soft preference.** A candidate is admitted only if **at least one** of its `dominantColors` has a WCAG contrast ratio ≥ **1.6** against the fabric hex (`isHarmonious`, `lib/engine/harmony.ts`; full WCAG relative luminance, sRGB → linear `0.2126 R + 0.7152 G + 0.0722 B`). `checkInvariants` re-asserts this on every patch in the final spec, so **even an explicit must-have cannot bypass it** — a pinned patch that would vanish into the fabric is dropped and the next candidate fills the slot. This protects the physical product (an invisible embroidered patch is a defect). The back hero is the sole exception — it is never contrast-gated, because suppressing a real team logo would be worse than low contrast. (`luminance()` throws on a malformed non-6-hex colour to catch bad pipeline data early.)

**All-ages content filter** (`audience`). When the wearer audience is `kid`, adult-themed patches (`ADULT_PATCH_IDS` in `lib/catalog/audience.ts` — alcohol, gambling, the Vegas-adult tagline) are excluded from **every** source: must-haves *and* surprise fillers (the Extras picker hides them too). The garment is unisex, so this is purely a content gate — it never changes the cut or the chosen size. Adult is the default when no audience is given, so existing behaviour is unchanged.

**Density budget** (`densityBudget`). The number of patches per tier: `minimal → 1`, `balanced → 4`, `maximal → 10`. This equals the hard cap (`DENSITY_MAX`), so the count the fan is promised ("up to N patches") is exactly what they get, and **maximal fills all ten zones**. The questionnaire caps must-have pins at this same number, so every pinned patch is guaranteed to appear.

### 2. Placement — where they go

**Zone assignment** (`assignZones`, `lib/engine/zones.ts`). The harmony-filtered candidate list is mapped onto a fixed **priority fill order** (`PATCH_ZONE_PRIORITY`, `lib/catalog/zones.ts`):

```
front_chest → back_upper → left_sleeve_1 ↔ right_sleeve_1 → … → left_sleeve_4 ↔ right_sleeve_4
```

The i-th candidate lands in the i-th zone, taking `min(budget, candidates, zones)` patches. Because team patches lead the candidate list, the recognizable team marks take the most prominent zones first — #2 team → `front_chest`, #3 team → `back_upper`, then the must-have add-ons and the colour-matched surprise fillers down the sleeves. Sleeves are filled **alternating left/right** so a half-empty design still looks balanced. Invariants (`checkInvariants`) then guarantee: exactly one back graphic in `back_center`, only approved catalog ids, every patch zone valid and unique, harmony on every patch, and the density cap respected.

### 3. 3D embroidered placement

`lib/three/zone-transforms.ts` + `components/three/HoodieGLB.tsx` turn the spec's abstract zones into physical, conformed graphics on the GLB hoodie:

- **Baking.** Every mesh's world transform is flattened into its geometry (`applyMatrix4(matrixWorld)`) and reparented into one identity-space group, so the body geometry, the decals, and the rendered mesh all share a single coordinate frame — no double-transform, no floating patches.
- **Surface point + normal.** Each zone in `ZONE_GLB` is a **surface point** and **outward normal** measured by raycasting the real baked mesh — the chest sits on the *right* chest, sleeve patches on the *outer* face (≈ ±x normals), exactly like the PDF layout.
- **Conforming decals.** Each logo is projected with three.js `DecalGeometry`, which clips the mesh's own triangles into the logo footprint. The graphic wraps the curved fabric — the embroidered look — instead of floating as a flat card. A square projector + square source PNGs preserve aspect ratio, so logos are never stretched.
- **Upright orientation.** A tangent frame is built from the surface normal (local **+z** = outward normal, local **+y** = world-up projected onto the tangent plane), so every graphic conforms *and* stays upright — never upside-down — with a pole-safe fallback when the normal is near-vertical.
- **No bleed-through.** The hood is up, leaving an open neck. An **inner-shell occluder** — a copy of the body scaled inward (mostly in depth) about its centroid — sits just inside every surface. It backs the open neck and zipper gap with opaque fabric so back-panel logos can't be seen from the front, yet stays *behind* those logos from the rear (so the back reads perfectly) and is invisible from every exterior angle.

The result: the reveal viewer shows precisely what the embroidery machine will produce.

### Catalog & data model

The full catalog lives in `assets/catalog.json` and is loaded by `lib/catalog/back-graphics.ts` and `lib/catalog/placement-graphics.ts`:

- **34 back graphics**: 4 non-team (Las Vegas Summer League, Summer League, NBA, city text) + 30 franchise team logos (Chicago Bulls reuses its placement logo, since the PDF has no dedicated Bulls back). Each `Graphic` has a `file` path under `public/` (e.g. `/logos/back/back_05_hawks.png`).
- **94 placement graphics** — 30 canonical franchise logos (one `team`-tagged each) + 4 team alternates + 60 non-team patches.
- **3 hoodie colors** — Bone, Black, Grey (`lib/catalog/hoodie-colors.ts`).
- **Chicago Bulls** has no dedicated back graphic in the source PDF, so it reuses its official placement logo as the back graphic (`back_34_bulls`). Bulls fans see the Bulls on the back like every other franchise.
- The catalog was generated by the pipeline in `assets/` (`extract.py` → `build_catalog.py`) from the source PDFs. See `assets/README.md` for details.

## API Reference

### `POST /api/generate`

Request body — `QuestionnaireAnswers` (JSON):

```json
{
  "hoodieColor": "bone",
  "teamsRanked": ["warriors", "celtics"],
  "density": "balanced",
  "vibe": "classic",
  "mustHaveIds": ["plc_40_flamingo", "plc_30_palm-tree"],
  "audience": "adult",
  "size": "M"
}
```

`mustHaveIds` is optional — an ordered list of placement-catalog ids the fan pins as add-ons. They are placed **after** the picked teams' patches (team identity leads) but ahead of the colour-matched surprise fillers. Each must still pass harmony and fit within the density cap.

`audience` (`adult` | `kid`, default `adult`) and `size` are optional. `kid` excludes adult-themed patches from the design; `size` is unisex order metadata that doesn't affect the design. Both are echoed back on `spec.meta`.

Responses:

| Status | Body |
|---|---|
| `200` | `{ "spec": { ...DesignSpec } }` |
| `400` (invalid JSON) | `{ "error": "invalid JSON" }` |
| `400` (schema-invalid) | `{ "error": <zod .flatten() object> }` |
| `500` (engine error) | `{ "error": "<message>" }` |

### `POST /api/chat`

Server proxy for the assistant. The browser only talks to this route; the OpenRouter key never reaches the client. Request body: `{ "messages": [{ "role": "user" | "assistant", "content": string }] }`. Streams the reply back as plain text. The assistant is scoped to the NBA, the Summer League, LiveX, and this product, and degrades to a friendly message when no key is set.

## Configuration

All variables are optional — the app runs with zero external calls when they're unset. Copy `.env.example` to `.env.local`.

| Variable | Default | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | — | **Server-only.** Enables the chat assistant. Required only if you want the chatbot to answer. |
| `OPENROUTER_CHAT_MODEL` | `openrouter/owl-alpha` | Chat model (any OpenRouter, OpenAI-compatible id). |
| `OPENROUTER_SITE_URL` | `https://livex.ai` | Sent as the OpenRouter attribution referer. |
| `ENABLE_LLM_CURATION` | `false` | Gates the (inert) LLM curation seam. |
| `SUPABASE_URL` | — | Server-only; used by the (inert) persistence seam. |
| `SUPABASE_ANON_KEY` | — | Server-only; used by the (inert) persistence seam. |

> **OpenRouter free-model note:** free/stealth models (including `owl-alpha`) route through providers that require you to **enable prompt logging** under *OpenRouter → Settings → Privacy*. Without it, requests return `404 (no endpoints match your data policy)` and the assistant will say so.

Secrets are **never** exposed to the client — none are prefixed `NEXT_PUBLIC_`, and the key is read only inside `app/api/chat/route.ts`.

## Testing

```bash
npm test            # vitest run (all suites, one-shot)
npm run test:watch  # vitest watch mode
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
```

The engine is the most heavily tested layer — determinism, harmony gating, density caps, zone uniqueness, and the back-hero/league-pick resolution are all covered.

## Deployment

The app deploys cleanly to **Vercel** (or any Next.js host).

1. Import the repo into Vercel.
2. Add environment variables (Settings → Environment Variables) for the features you want. Only `OPENROUTER_API_KEY` is needed for the chatbot; scope it to **Production** (and **Preview** if desired).
3. Deploy. Environment-variable changes only take effect on the **next** deployment.

For a high-traffic public launch, put a rate limiter in front of `POST /api/chat` (e.g. Vercel KV / Upstash) — it currently relies on bounded history and a max-token cap only.

## Brand

- Primary blue `#2845E7` on background `#000000`
- Fonts: **Poppins** (body/UI) + **Archivo** (display), via `next/font/google`
- LiveX wordmark: always the exact SVG asset (reversed to white on dark surfaces — never re-typeset)

## Docs

- **Design spec:** `docs/superpowers/specs/2026-06-24-livex-nba-hoodie-core-spine-design.md`
- **Plan 1 (Foundation & Engine):** `docs/superpowers/plans/2026-06-24-core-spine-1-foundation-and-engine.md`
