# NBA Summer League × LiveX — Design Your Drop

A fan hoodie design experience for the 2026 NBA Summer League × LiveX collaboration. A fan answers five quick questions (team, colorway, vibe, density, an optional must-have), a deterministic engine generates a `DesignSpec` (one hero back graphic + up to ten harmony-checked placement patches), and the design is revealed on a **photorealistic, rotatable 3D hoodie** with every graphic conformed to the fabric like real embroidery. Because the hoodies are physically manufactured, what you see in the viewer is what gets made.

**End-to-end and deployable:** branded landing → five-step questionnaire → 3D reveal, all on top of a pure, fully-tested rules engine and an approved-catalog data model.

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

Routes:

| Route | What it is |
|---|---|
| `/` | Branded animated landing — scroll-driven 3D hero, video reels, CTA |
| `/design` | The five-step questionnaire → 3D reveal (the whole fan experience) |
| `/preview` | Dev-only sandbox for tuning the 3D viewer against any spec |
| `/api/generate` | `POST` endpoint — `QuestionnaireAnswers` → `DesignSpec` |

## Testing

```bash
npm test          # vitest run (all suites, one-shot)
npm run test:watch  # vitest watch mode
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
```

## Landing Page

The `/` route is a scroll-driven animated landing page. A fixed full-viewport 3D canvas sits behind the DOM; as the user scrolls, a LeBron model rotates through choreographed act keyframes.

### How to add a video

1. Drop `<id>.mp4` into `/public/videos/` (e.g. `/public/videos/reel-1.mp4`).
2. Optionally add a poster frame at `/public/videos/posters/<id>.jpg`.
3. In `lib/landing/landing.config.ts`, update the matching entry in `LANDING_SECTIONS`:

```ts
{ id: 'reel-1', kind: 'video', headline: 'BUILT FOR THE MOMENT',
  videoSrc: '/videos/reel-1.mp4',
  poster: '/videos/posters/reel-1.jpg', // optional
  videoMode: 'play', // 'play' (auto plays in viewport) | 'scrub' (tied to scroll)
  theme: 'dark' },
```

Before any video is added, each slot shows a designed pulse placeholder (intentional — it looks fine in prod too).

### How to swap the hero model

The hero model is served from `/public/models/lebron.glb`. To replace it:

```bash
node scripts/build-lebron.mjs --src=<path/to/source.fbx>
```

Requirements: Blender installed at `/Applications/Blender.app` and `@gltf-transform/cli` available via `npx`. The script converts the FBX to GLB via Blender, then runs Draco compression + WebP texture optimisation. Update `public/models/lebron-LICENSE.txt` with the new model's licence before any public launch.

### How to add the logos

`BrandLockup` reads two SVG files from `/public/logos/`. Drop in:

- `/public/logos/livex-ai.svg` — LiveX AI wordmark
- `/public/logos/nba-summer-league.svg` — NBA Summer League badge

No config change is needed. If either file is missing, a mono text fallback renders in its place.

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

lib/catalog/      — data model: types, zones, graphic catalogs (full 33/94)
  types.ts          → Graphic, DesignSpec, QuestionnaireAnswers, PatchZone, …
  zones.ts          → PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS
  teams.ts          → TEAMS (30 franchises), FEATURED_PATCHES (must-have options)
  index.ts          → catalog arrays + lookup helpers

lib/three/        — 3D placement model
  zone-transforms.ts → ZONE_GLB: per-zone surface point + normal on the hoodie mesh

lib/questionnaire/options.ts — vibe + density option metadata for the wizard

components/design/            — the fan-facing flow (client)
  DesignWizard.tsx  → five-step questionnaire state machine
  Reveal.tsx        → result screen: rotating 3D hoodie + design breakdown
  primitives.tsx    → shared UI (SelectTile, buttons, headings)

components/three/             — the 3D viewer
  HoodieViewer.tsx  → R3F canvas, studio lighting, turntable, OrbitControls
  HoodieGLB.tsx     → loads/bakes the GLB, recolors fabric, projects decals + occluder

app/
  page.tsx          → branded landing
  design/page.tsx   → renders <DesignWizard /> (the whole experience)
  api/generate/route.ts → POST /api/generate → calls generate()
  layout.tsx, globals.css → fonts + brand theme

lib/store/        — inert persistence seam (LocalJsonStore)
lib/curation/     — inert LLM curation seam
```

The engine is pure TypeScript with no I/O, so the wizard calls `generate(answers)` **directly on the client** — the reveal needs no server round-trip. `POST /api/generate` remains for programmatic/server use and parity testing.

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

### Catalog

The full catalog lives in `assets/catalog.json` and is loaded by `lib/catalog/back-graphics.ts` and `lib/catalog/placement-graphics.ts`:

- **33 back graphics** — 4 non-team (Summer League, NBA, city text) + 29 franchise team logos. Each `Graphic` has a `file` path under `public/` (e.g. `/logos/back/back_05_hawks.png`).
- **94 placement graphics** — 30 canonical franchise logos (one `team`-tagged each) + 4 team alternates + 60 non-team patches.
- **Chicago Bulls (`bulls`) is intentionally absent from the back catalog** — no Bulls back graphic exists in the source PDF. Bulls fans get the Summer League logo on the back, with the Bulls patch on placement.
- The catalog was generated by the pipeline in `assets/` (`extract.py` → `build_catalog.py`) from source PDFs. See `assets/README.md` for details.
- The back graphic is always the #1 team's official logo and is intentionally NOT contrast-gated. Only placement patches are harmony-filtered.

## Algorithm — Logo Selection & Placement

Turning five answers into a manufacturable design is two distinct problems: **selection** (*which* graphics) and **placement** (*where* they go, in the 2D spec and on the 3D garment). Every step is pure and deterministic — identical `QuestionnaireAnswers` always yield an identical `DesignSpec` (all tie-breaks sort by `id.localeCompare`; the engine never calls `Math.random`, `Date.now`, or does I/O).

### 1. Selection — which graphics

**Back hero** (`resolveBack`, `lib/engine/select.ts`). The single back graphic is the identity anchor, so team identity wins outright:

1. Take `teamsRanked[0]` (the fan's #1 team) and look up its official back logo via `teamBackGraphic(slug)`.
2. If there is no team, or that franchise has no back logo (**Chicago Bulls** — none exists in the source PDF), fall back to the lowest-`id` Summer League / Vegas back graphic.

The back hero is deliberately **not** harmony-filtered. Contrast-gating it would suppress real team logos (e.g. a dark logo on black), and the fan explicitly asked for that team — so it always goes on.

**Placement candidates** (`buildCandidates`). An *ordered* candidate list is assembled by descending intent. Each graphic is admitted at most once and only if it clears harmony (see below), so the list is de-duplicated and fabric-safe as it is built. **Team identity leads the design** — the teams the fan picked outrank the optional add-ons:

1. **Remaining ranked teams** — `teamPatch()` for `teamsRanked[1..]` (the #1 team already owns the back), in the fan's ranked order. **Team picks take priority**, so they claim the most prominent zones first (front chest, then upper back).
2. **Must-have add-ons** — the patches the fan pinned in the Extras step (`mustHaveIds`), **in their tap order**, placed after the team patches. The fan may pin as many as the density allows (see cap below).
3. **"Surprise" fillers** — `vegas` + `summer_league` identity patches and `fun` patches whose `mood[]` includes the chosen `vibe`, **ordered by colour affinity to the #1 team** (`paletteDistance`, `lib/engine/harmony.ts`): the fillers whose palette best matches the team the fan reps come first (e.g. a Lakers fan's surprises skew purple/gold; a Celtics fan's skew green), with a deterministic `id` tiebreak. With no team chosen, the distance is a constant so it falls back to a pure `id` sort.

**Placement is colour- and priority-aware; the placement *options* never change.** The ten patch zones are fixed (`PATCH_ZONE_PRIORITY`); only *which* candidate fills *which* zone is tuned — by candidate order. Because team patches lead, the recognizable marks land in the prominent zones (chest, upper back), and the colour-matched surprises fill the sleeves.

**Harmony is a hard invariant, not a soft preference.** A candidate is admitted only if **at least one** of its `dominantColors` has a WCAG contrast ratio ≥ **1.6** against the fabric hex (`isHarmonious`, `lib/engine/harmony.ts`; full WCAG relative luminance, sRGB → linear `0.2126 R + 0.7152 G + 0.0722 B`). `checkInvariants` re-asserts this on every patch in the final spec, so **even an explicit must-have cannot bypass it** — a pinned patch that would vanish into the fabric is dropped and the next candidate fills the slot. This protects the physical product (an invisible embroidered patch is a defect). The back hero is the sole exception — it is never contrast-gated, because suppressing a real team logo would be worse than low contrast. (`luminance()` throws on a malformed non-6-hex colour to catch bad pipeline data early.)

**Density budget** (`densityBudget`). The number of patches per tier: `minimal → 1`, `balanced → 4`, `maximal → 10`. This equals the hard cap (`DENSITY_MAX`), so the count the fan is promised ("up to N patches") is exactly what they get, and **maximal fills all ten zones**. The questionnaire caps must-have pins at this same number, so every pinned patch is guaranteed to appear.

### 2. Placement — where they go

**Zone assignment** (`assignZones`, `lib/engine/zones.ts`). The harmony-filtered candidate list is mapped onto a fixed **priority fill order** (`PATCH_ZONE_PRIORITY`, `lib/catalog/zones.ts`):

```
front_chest → back_upper → left_sleeve_1 ↔ right_sleeve_1 → … → left_sleeve_4 ↔ right_sleeve_4
```

The i-th candidate lands in the i-th zone, taking `min(budget, candidates, zones)` patches. Because team patches lead the candidate list, the recognizable team marks take the most prominent zones first — #2 team → `front_chest`, #3 team → `back_upper`, then the must-have add-ons and the colour-matched surprise fillers down the sleeves. Sleeves are filled **alternating left/right** so a half-empty design still looks balanced. Invariants (`checkInvariants`) then guarantee: exactly one back graphic in `back_center`, only approved catalog ids, every patch zone valid and unique, harmony on every patch, and the density cap respected.

**3D embroidered placement** (`lib/three/zone-transforms.ts` + `components/three/HoodieGLB.tsx`). The spec's abstract zones become physical, conformed graphics on the GLB hoodie:

- **Baking.** Every mesh's world transform is flattened into its geometry (`applyMatrix4(matrixWorld)`) and reparented into one identity-space group, so the body geometry, the decals, and the rendered mesh all share a single coordinate frame — no double-transform, no floating patches.
- **Surface point + normal.** Each zone in `ZONE_GLB` is a **surface point** and **outward normal** measured by raycasting the real baked mesh — the chest sits on the *right* chest, sleeve patches on the *outer* face (≈ ±x normals), exactly like the PDF layout.
- **Conforming decals.** Each logo is projected with three.js `DecalGeometry`, which clips the mesh's own triangles into the logo footprint. The graphic wraps the curved fabric — the embroidered look — instead of floating as a flat card. A square projector + square source PNGs preserve aspect ratio, so logos are never stretched.
- **Upright orientation.** A tangent frame is built from the surface normal (local **+z** = outward normal, local **+y** = world-up projected onto the tangent plane), so every graphic conforms *and* stays upright — never upside-down — with a pole-safe fallback when the normal is near-vertical.
- **No bleed-through.** The hood is up, leaving an open neck. An **inner-shell occluder** — a copy of the body scaled inward (mostly in depth) about its centroid — sits just inside every surface. It backs the open neck and zipper gap with opaque fabric so back-panel logos can't be seen from the front, yet stays *behind* those logos from the rear (so the back reads perfectly) and is invisible from every exterior angle.

The result: the reveal viewer shows precisely what the embroidery machine will produce.

## API

`POST /api/generate`

Request body: `QuestionnaireAnswers` (JSON)

```json
{
  "hoodieColor": "bone",
  "teamsRanked": ["warriors", "celtics"],
  "density": "balanced",
  "vibe": "classic",
  "mustHaveIds": ["plc_40_flamingo", "plc_30_palm-tree"]
}
```

`mustHaveIds` is optional — an ordered list of placement-catalog ids the fan pins as add-ons. They are placed **after** the picked teams' patches (team identity leads) but ahead of the colour-matched surprise fillers; see the algorithm section. Each must still pass harmony and fits within the density cap.

Response:
- **200 (success):** `{ "spec": { ...DesignSpec } }` (the spec is nested under a `spec` key)
- **400 (invalid JSON):** `{ "error": "invalid JSON" }`
- **400 (schema-invalid input):** `{ "error": <structured zod error object from .flatten()> }` (e.g., `{ formErrors: [], fieldErrors: {...} }`)
- **500 (unexpected engine error):** `{ "error": "<message>" }`

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
