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

### Graphic Catalog (seed subset — Plan 2 delivers the full set)
- **Back graphics** (`lib/catalog/back-graphics.ts`): seed has 5 items; Plan 2 target is **33**.
- **Placement graphics** (`lib/catalog/placement-graphics.ts`): Plan 2 target is **94**.
- IDs are stable slug strings (e.g. `back_01_las-vegas-summer-league`, `patch_01_lvsl`).

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
