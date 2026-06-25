# NBA Summer League × LiveX — Hoodie Design Engine

Custom hoodie design tool for the 2026 NBA Summer League × LiveX collaboration. Answer a short questionnaire (team preferences, vibe, density) and the engine deterministically generates a `DesignSpec`: one hero back graphic + up to ten placement patches, harmony-checked against your fabric color.

**Plan 1 (Foundation & Engine)** is complete. Plans 2 (Assets & Catalog) and 3 (3D & Questionnaire UI) follow.

---

## Setup

```bash
npm install
cp .env.example .env.local   # all vars optional in Milestone 1 — see below
```

## Running

```bash
npm run dev       # local dev server → http://localhost:3000
npm run build     # production build
npm start         # serve the built app
```

## Testing

```bash
npm test          # vitest run (all suites, one-shot)
npm run test:watch  # vitest watch mode
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
```

## Architecture

```
lib/engine/       — framework-free, pure, deterministic design engine
  generate.ts       → generate(answers) → DesignSpec (main entry point)
  harmony.ts        → isHarmonious(), contrastRatio()
  select.ts         → resolveBack(), densityBudget(), buildCandidates()
  zones.ts          → assignZones()
  rationale.ts      → buildRationale()
  schema.ts         → designSpecSchema (zod), checkInvariants(), DENSITY_MAX
  answers-schema.ts → zod schema for QuestionnaireAnswers

lib/catalog/      — data model: types, zones, seed graphic catalogs
  types.ts          → Graphic, DesignSpec, QuestionnaireAnswers, PatchZone, …
  zones.ts          → PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS
  index.ts          → catalog arrays + lookup helpers

lib/store/        — inert state seam (wired in Plan 3)
lib/curation/     — inert LLM curation seam (wired in Plan 2)

app/api/generate/route.ts   — POST /api/generate → calls generate()
app/                        — branded Next.js shell (layout, page, globals.css)
```

### Data Flow

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

### Catalog: Seed vs. Full

The current catalog in `lib/catalog/` is a **seed subset** (5 back graphics, a handful of placements) explicitly labeled in the source. Plan 2 will replace it with the full PDF-generated catalog (target: 33 back graphics, 94 placement graphics). The engine, schema, and invariant checks are already written to handle the full set.

## API

`POST /api/generate`

Request body: `QuestionnaireAnswers` (JSON)

```json
{
  "hoodieColor": "bone",
  "teamsRanked": ["warriors", "celtics"],
  "density": "balanced",
  "vibe": "classic"
}
```

Response: `DesignSpec` (JSON) or `{ "error": "..." }` with status 400/500.

## Environment Variables

All optional in Milestone 1 — the app works with zero external calls.

| Variable | Default | Purpose |
|---|---|---|
| `ENABLE_LLM_CURATION` | `false` | Gates the LLM curation path (Plan 2) |
| `OPENROUTER_API_KEY` | — | Server-side; used by curation seam when enabled |
| `SUPABASE_URL` | — | Server-side; used by persistence seam (Plan 3) |
| `SUPABASE_ANON_KEY` | — | Server-side; used by persistence seam (Plan 3) |

## Brand

- Primary blue: `#2845E7` on background `#000000`
- Fonts: **Poppins** (body/UI) + **Archivo** (display), via `next/font/google`
- LiveX wordmark: always the exact SVG asset

## Docs

- **Design spec:** `docs/superpowers/specs/2026-06-24-livex-nba-hoodie-core-spine-design.md`
- **Plan 1 (Foundation & Engine):** `docs/superpowers/plans/2026-06-24-core-spine-1-foundation-and-engine.md`
