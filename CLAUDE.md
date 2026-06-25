@AGENTS.md

# LiveX × NBA Summer League — Hoodie Engine: Agent Context

## Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) |
| UI Library | **React 19** |
| Language | **TypeScript** (strict, `noUncheckedIndexedAccess`) |
| Styling | **Tailwind CSS v4** — CSS-based `@theme` in `app/globals.css` (no `tailwind.config.ts`) |
| Validation | **zod v4** |
| Testing | **Vitest** (`node` environment) |
| Module system | ESM (`"type": "module"` in `package.json`) |

## Commands

```bash
npm run dev         # local dev server (do not run in CI — it hangs)
npm run build       # Next.js production build
npm start           # serve the built app
npm run lint        # eslint . (NOT next lint — no next.config rule)
npm run typecheck   # tsc --noEmit
npm test            # vitest run (all suites)
npm run test:watch  # vitest (watch mode)
```

## Verified Brand Tokens

All brand tokens live in `app/globals.css` inside the `@theme {}` block.

| Token | Value | Source |
|---|---|---|
| Primary blue | `#2845E7` | Verified from `livex new logo blue.svg` |
| Background | `#000000` | `--color-bg` |
| Surface | `#0B0D14` | `--color-surface` |
| Surface raised | `#12151F` | `--color-surface-raised` |
| Ink (text) | `#F5F7FA` | `--color-ink` |
| Ink muted | `#9AA3B2` | `--color-ink-muted` |
| Line / border | `#1E2230` | `--color-line` |
| Deep brand | `#0A2A66` | `--color-brand-deep` |

**Fonts:** `Poppins` (UI/body, `--font-sans`) and `Archivo` (display, `--font-display`), both loaded via `next/font/google` in `app/layout.tsx`.

**LiveX wordmark:** must always be the exact SVG asset — never re-typeset in CSS/HTML text.

## Catalog and Zone Data Model

### Hoodie Colors (4)
`bone` | `black` | `grey` | `white` — defined in `lib/catalog/hoodie-colors.ts` with hex fabric values.

### Graphic Catalog (full set from `assets/catalog.json`)
- **Back graphics** (`lib/catalog/back-graphics.ts`): **33 items** — 4 non-team + 29 franchise logos.
- **Placement graphics** (`lib/catalog/placement-graphics.ts`): **94 items** — 30 canonical franchise logos (one `team`-tagged each) + 4 team alternates + 60 non-team patches.
- Both catalogs load from `@/assets/catalog.json` (pipeline: `extract.py` → `build_catalog.py`).
- IDs are stable slug strings (e.g. `back_01_las-vegas-summer-league`, `plc_01_martini`).
- Each `Graphic` carries a `file` field: a path under `public/` (e.g. `/logos/back/back_05_hawks.png`).
- **Chicago Bulls (`bulls`) is intentionally absent from the back catalog** — no Bulls back graphic exists in the source PDF. The engine falls back to the Summer League logo for Bulls fans on the back.
- Exactly one placement graphic per franchise carries a `team` slug (the canonical logo for `teamPatch()` lookups).

### Zones
- **Back zone:** exactly one — `back_center` (type `BackZone`).
- **Patch zones** (type `PatchZone`, 10 total): `front_chest`, `back_upper`, `left_sleeve_1..4`, `right_sleeve_1..4`.
- Zone priority fill order: `front_chest` → `back_upper` → `left_sleeve_1` ↔ `right_sleeve_1` → …
- `ZONES_9` subset: drops `left_sleeve_4` and `right_sleeve_4`.

### Core Types (`lib/catalog/types.ts`)
`Graphic`, `HoodieColorDef`, `QuestionnaireAnswers`, `DesignSpec`, `Density`, `Vibe`, `Mood`, `BackZone`, `PatchZone`, `GraphicCategory`.

## Hard Constraints

1. **Exactly one back graphic in `back_center`** — `backGraphic.zone` must always be `'back_center'`; there is no other back zone.
2. **Approved catalog IDs only** — `backGraphic.id` must exist in `BACK_GRAPHIC_CATALOG`; each `patch.id` must exist in `PLACEMENT_GRAPHIC_CATALOG`. Never invent catalog items.
3. **Valid + unique patch zones** — every `patch.zone` must be in `PATCH_ZONE_PRIORITY`; no zone may appear more than once in `patches`.
4. **Density caps** (from `DENSITY_MAX` in `lib/engine/schema.ts`):
   - `minimal` → max **1** patch
   - `balanced` → max **4** patches
   - `maximal` → max **10** patches
5. **Color harmony** — every patch must have at least one `dominantColor` whose WCAG contrast ratio against the fabric hex is ≥ 1.6. Enforced by `isHarmonious()` in `lib/engine/harmony.ts`.
   - **Back graphic is intentionally NOT harmony-filtered.** `resolveBack()` always places the #1 ranked team's official logo (or the Summer League fallback) on the back — team identity must win. Contrast-gating the back graphic would suppress real team logos. Only placement patches are harmony-filtered. `luminance()` (and therefore `contrastRatio`) throws with a clear error on a non-6-hex input to catch malformed pipeline colours early.
6. **Deterministic engine** — given the same `QuestionnaireAnswers`, `generate()` must return the identical `DesignSpec`. Sorting is by `id.localeCompare`.

## Engine Architecture

```
lib/engine/
  harmony.ts      — isHarmonious(), contrastRatio()
  select.ts       — resolveBack(), densityBudget(), buildCandidates()
  zones.ts        — assignZones()
  rationale.ts    — buildRationale()
  schema.ts       — designSpecSchema (zod), checkInvariants(), DENSITY_MAX
  generate.ts     — generate() orchestrator (calls all of the above)
  answers-schema.ts — zod schema for QuestionnaireAnswers

lib/catalog/
  types.ts        — all shared TypeScript types
  zones.ts        — BACK_ZONE, PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS
  hoodie-colors.ts, back-graphics.ts, placement-graphics.ts
  index.ts        — re-exports + lookup helpers (backById, placementById, teamBackGraphic, teamPatch)

lib/store/design-store.ts   — inert state seam (Plan 3)
lib/curation/curator.ts     — inert LLM curation seam (Plan 2)

app/api/generate/route.ts   — POST /api/generate → calls generate()
app/layout.tsx, app/page.tsx, app/globals.css — branded shell
```

## Landing Page Architecture

The `/` route is a scroll-driven, 3D animated landing page. Key facts for agents working on it:

### Fixed Canvas + DOM layers
- `HeroCanvas` (`components/landing/HeroCanvas.tsx`) — a full-viewport R3F `<Canvas>` with `fixed inset-0 -z-10` (behind the DOM). Dynamically imported with `ssr: false` in `app/page.tsx`.
- The DOM content (`<main className="relative z-10">`) scrolls over the fixed canvas; the model reacts to scroll via a singleton rather than a React prop to avoid re-render overhead.

### Scroll-state singleton
- `lib/landing/scroll-state.ts` exports `scrollState = { progress: 0 }` — a mutable object, not React state.
- `useLebronActs(enabled)` (`components/landing/useLebronActs.ts`) sets up one GSAP ScrollTrigger that maps scroll position 0..1 into `scrollState.progress`. It is enabled only after the preloader clears and only when `reducedMotion` is false.
- `LebronModel` reads `scrollState.progress` inside `useFrame` every tick — zero React re-renders on scroll.

### Act keyframes + `poseAtProgress`
- `ACT_KEYFRAMES` in `lib/landing/landing.config.ts` — array of `ActKeyframe` (`at`, `rotationY`, `position`, `scale`, `intensity`) covering scroll 0..1 (0..720° rotation, landing front-facing).
- `poseAtProgress(progress, keys?)` (`lib/landing/acts.ts`) cubic-ease-interpolates between the two bracketing keyframes and returns a `LebronPose`. Always import from `lib/landing/acts.ts`; never call `Math.random` or `Date.now` here.
- The key light intensity is driven by `pose.intensity` via a callback (`onIntensity`) passed to `LebronModel`.

### Smooth scroll + GSAP ticker sync
- `SmoothScroll` (`components/landing/SmoothScroll.tsx`) wraps `ReactLenis` (from `lenis/react`) with `autoRaf: false`, then drives Lenis via `gsap.ticker.add(update)` — this keeps Lenis and ScrollTrigger on the same tick, preventing jitter.
- When `reduced=true` (from `useCapability()`) the lerp is set to `1` (instant) and `useLebronActs` is disabled.

### Postprocessing
- `EffectComposer` + `Bloom` (`@react-three/postprocessing`) are loaded on the `high` tier only. Low tier (coarse pointer + narrow viewport) skips them.

### Config-driven sections
- `LANDING_SECTIONS` (`lib/landing/landing.config.ts`) drives the entire page order. `SectionRenderer` maps `kind` → component (`hero` | `video` | `content` | `cta`).
- `ScrollVideo` supports two modes: `play` (plays/pauses on viewport enter/leave) and `scrub` (maps scroll progress to `video.currentTime`). Shows a designed pulse placeholder when `videoSrc` is absent.

### Video drop-in workflow
1. Drop `<id>.mp4` into `/public/videos/` (and optionally a poster at `/public/videos/posters/<id>.jpg`).
2. In `LANDING_SECTIONS` (in `lib/landing/landing.config.ts`), set `videoSrc: '/videos/<id>.mp4'` and optionally `poster: '/videos/posters/<id>.jpg'` on the matching section.
3. Set `videoMode: 'play'` (default) or `'scrub'`.
4. No other changes required.

### Hero model pipeline
- Model served from `/public/models/lebron.glb`.
- To swap: run `node scripts/build-lebron.mjs --src=<path/to/source.fbx>`. Requires Blender at `/Applications/Blender.app` and `@gltf-transform/cli` (Draco + WebP).
- Replace the output at `public/models/lebron.glb`. The LICENSE note at `public/models/lebron-LICENSE.txt` must be updated for any non-placeholder model.

### Logos
- `BrandLockup` (`components/landing/BrandLockup.tsx`) reads `/public/logos/livex-ai.svg` and `/public/logos/nba-summer-league.svg`. Drop the SVGs there — no config change needed.

### Fallbacks
- `useCapability()` (`lib/landing/use-capability.ts`) — detects `prefers-reduced-motion` and coarse-pointer/narrow-viewport (`low` tier). Returns `{ reducedMotion, tier }` used in `app/page.tsx` to configure `SmoothScroll`, `HeroCanvas`, and `useLebronActs`.
- `Preloader` (`components/landing/Preloader.tsx`) — tied to drei `useProgress`. A 2 s safety timer fires `reveal()` when `!active`, so it can never stick on a warm cache.

### Page transition
- `usePageTransition()` (`components/landing/PageTransition.tsx`) — GSAP brand-blue overlay wipes up before `router.push('/design')`.

## Patterns to Avoid

- **No `Math.random()`, `Date.now()`, or any I/O in the engine.** The engine (`lib/engine/`) must be pure and deterministic. Randomness breaks reproducibility and breaks tests.
- **No secrets on the client side.** `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` are server-only. Never import them in client components or export them via `NEXT_PUBLIC_`.
- **Never invent catalog IDs or zones.** Only use IDs that exist in `BACK_GRAPHIC_CATALOG` or `PLACEMENT_GRAPHIC_CATALOG`. Only use zones from `PATCH_ZONE_PRIORITY` (or `BACK_ZONE`).
- **Do not add a `hood` zone.** There is no hood zone in this design system. The spec has no hood placement.
- **Do not use Inter, Roboto, Arial, or Space Grotesk for display text.** The only approved fonts are Poppins (body) and Archivo (display).
- **Do not create `tailwind.config.ts`.** Tailwind v4 is configured via `@theme {}` in `app/globals.css`. No config file.
- **Do not call `next lint`.** The lint command is `eslint .` (see `npm run lint`).
- **Do not add a `hood` zone.** (Repeated because it is a common mistake — the brief explicitly forbids it.)

## Environment Variables (all optional in Milestone 1)

See `.env.example`. Copy to `.env.local`. The app works with no external calls when all vars are unset or `false`.

| Variable | Default | Purpose |
|---|---|---|
| `ENABLE_LLM_CURATION` | `false` | Enables the LLM curation seam (Plan 2) |
| `OPENROUTER_API_KEY` | — | Server-side only; used by curation seam |
| `SUPABASE_URL` | — | Server-side only; used by persistence seam |
| `SUPABASE_ANON_KEY` | — | Server-side only; used by persistence seam |
