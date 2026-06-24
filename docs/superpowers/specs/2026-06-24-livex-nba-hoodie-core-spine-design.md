# Design Spec — NBA Summer League × LiveX AI "Design Your Drop" Hoodie

- **Date:** 2026-06-24
- **Status:** Approved (design); pending spec review before implementation plan
- **Milestone:** 1 — "Core Spine"
- **Branch:** `feat/core-spine`

---

## 1. Summary

A fast fan experience: answer ~5 quick questions (~20s) → a deterministic rules
engine produces a **validated, manufacturable hoodie design** → render it on a
**rotating 3D hoodie** with real logo placement. The hoodie a fan designs is
physically produced (by the decorator **"brodenim"**, branded on the source
PDFs), so every output must be valid, on-brand, and manufacturable.

This spec covers **Milestone 1 (Core Spine)** in full and defines clean seams for
later milestones (AR try-on, save/export/share, Supabase persistence, OpenRouter
LLM curation) without implementing them yet.

## 2. Goals & Non-Goals

**Goals (M1)**
- 5-question flow → deterministic engine → schema-valid `DesignSpec`.
- 3D hoodie rendering the correct base color + exactly one back graphic + N
  placement patches on **PDF-accurate zones**, auto-rotating, premium lighting.
- Asset pipeline producing the 127 decal PNGs + `catalog.json` from the PDFs.
- Locked, **verified** LiveX brand design system.
- `CLAUDE.md`, `README.md`, unit tests, lint, typecheck — all passing.
- **Works with zero external API calls.**

**Non-Goals (M1 — deferred, seams only)**
- AR/webcam try-on (Tier A/B).
- `save` / `export` / `share` route handlers + Supabase persistence.
- OpenRouter LLM curation + image generation.
- Multi-language, auth, payments, real fulfillment.

## 3. Verified Facts (not estimates)

**Brand tokens — pulled from LiveX's live assets/CSS (2026-06-24):**
- Primary electric blue **`#2845E7`** — verified: appears 24× as `fill` in the
  official `livex new logo blue.svg`; dominant color of the hero `Gradient.png`.
- Base background **`#000000`** (true black); the hero gradient is `#2845E7`
  glowing out of near-black (`#02040F`–`#030615`).
- *Correction:* research's estimate `#1E5BFF` is superseded by verified `#2845E7`.
  The dossier's violet/cyan are **not** in LiveX's real assets — treated as
  optional NBA-energy accents only, never the brand base.
- **Fonts (verified from `livexai.webflow.shared.css`):** primary **Poppins**
  (104 declarations), with **Onest** and **Jowansans** for display, Roboto as
  fallback. → We lock **Poppins** as the on-brand UI/body face. Per
  frontend-design (which bans Inter/Roboto/Arial/Space Grotesk as "AI slop"),
  the big NBA Summer League headlines use one characterful display face —
  **default "Clash Display"** (free, geometric, confident), finalized in the
  design-system pass. The **LiveX wordmark is always the exact SVG**, never
  re-typeset.

**Manufacturer:** PDF 1 is branded "brodenim" — the apparel decorator. Relevant
later for the export/spec-sheet handoff.

## 4. Catalog Data Model (decoded from the 3 PDFs — source of truth)

### 4.1 Hoodie colors (4)
`bone`, `black`, `grey`, `white`. (PDF 3 Step 1 shows all four; PDF 1's swatch
page omits white.)

### 4.2 Back graphics — `BACK_GRAPHIC_CATALOG`, 33 items (IDs 1–33)
Exactly **one** allowed, always in zone `back_center`. Structure (from PDF 1 grid
+ PDF 3 Step 3): a small set of **Summer League / Las Vegas / NBA-logo / city-text
graphics** (IDs ~1–4) followed by the **30 NBA team logos** (IDs ~5–33, ending
76ers). Exact `id ↔ team` mapping is **locked by the QA'd asset pipeline against
the PDF**, not guessed here (see §9).

### 4.3 Placement graphics — `PLACEMENT_GRAPHIC_CATALOG`, 94 items (IDs 1–94)
Any number, subject to density caps. Two bands:
- **IDs 1–61 — themed graphics:** martini, "Welcome to Las Vegas" sign, "What
  Happens in Vegas…", basketballs, foam finger, sun, planet, flower, cherries,
  pizza, wave, flaming "Summer League", Western/Eastern Conference, trophy, eye,
  lips, NBA jersey, hoop net, rainbow, stars (multiple colors), shamrock, palm
  tree, basketball hearts, "I♥NBA", Nevada license plate, poker chips, SL mascot,
  flamingo, surfboard, sunglasses, cactus, sugar skulls, city-text ("Los
  Angeles", "Las Vegas", "The Bay"), Lakers/SL scripts, pennants, "Summer League"
  banner.
- **IDs 62–94 — NBA team logos** (30 teams) + a few alternates (e.g., "The Bay",
  LA Lakers wordmark, Knicks wordmark).

Exact `id ↔ item` mapping is **canonically defined by `catalog.json`** emitted +
QA'd by the asset pipeline (§9). High-confidence anchors above guide labeling.

### 4.4 Placement zones — `PLACEMENT_ZONES` (PDF 3 Step 2 — "ONLY USE STEP 2")
PDF 3 Step 2 shows **two orientation templates**. We render on the **11-zone
superset**; the 9-zone is the same map minus the 4th sleeve position each side.

| Zone id | PDF # | Role |
|---|---|---|
| `back_center` | 3 | **Reserved** for the single back graphic |
| `front_chest` | 1 | patch |
| `back_upper` | 2 | patch |
| `left_sleeve_1..4` | 4,5,6,7 | patch |
| `right_sleeve_1..4` | 8,9,10,11 | patch |

→ **10 patch zones** + 1 back-graphic zone.

**Deliberate, documented deviation from the brief's *illustrative* enum:** the
brief listed `front_left_chest`/`front_right_chest`/`hood`. PDF 3 Step 2 shows a
**single** front-chest position, **no hood patch zone**, and a distinct
`back_upper` position. Per "encode exactly what the PDFs show / do not invent
placements," we follow the PDF: one `front_chest`, add `back_upper`, **drop
`hood`**, sleeves `_1.._4`.

## 5. `DesignSpec` Schema (validated every generation)

Zod schema; `PatchZone = {front_chest, back_upper, left_sleeve_1..4,
right_sleeve_1..4}` (never `back_center`).

```ts
DesignSpec = {
  hoodieColor: "bone" | "black" | "grey" | "white",
  backGraphic: { id: string /* ∈ BACK_GRAPHIC_CATALOG */, zone: "back_center" },
  patches: Array<{
    id: string,            // ∈ PLACEMENT_GRAPHIC_CATALOG
    zone: PatchZone,       // ∈ patch zones, unique per spec
    scale: number,         // within per-zone [min,max]
    rotationDeg: number,   // [-180, 180]
  }>,
  densityTier: "minimal" | "balanced" | "maximal",
  rationale: string,       // shown to fan
  meta: { favoriteTeamsRanked: string[], vibe: string, schemaVersion: "1.0" },
}
```

**Hard invariants (unit-tested):** exactly one `backGraphic` with
`zone==="back_center"`; `backGraphic.id ∈ BACK_GRAPHIC_CATALOG`; every
`patch.id ∈ PLACEMENT_GRAPHIC_CATALOG`; every `patch.zone ∈ PatchZone` (never
`back_center`); **no duplicate patch zone**; patch count within density cap;
color-harmony passes for every patch vs `hoodieColor`; `scale`/`rotationDeg`
in range.

## 6. Rules Engine (pure, deterministic, framework-free)

Modules under `lib/engine/` — no React, no IO, fully unit-testable.

- **`select.ts`** — resolve back graphic + build prioritized patch set.
  1. **Back slot:** #1 ranked team → its team logo at `back_center`; no team →
     a deterministic Summer League/Vegas back graphic.
  2. **Patch budget by density:** `minimal` → 0–1, `balanced` → 2–4,
     `maximal` → 6–10 (questionnaire "Loaded" → `maximal`). Concrete targets:
     minimal 1, balanced 3, maximal 8 (clamped to available harmonious zones).
  3. **Candidate priority:** remaining ranked teams → Vegas/Summer League
     identity → vibe(mood)-filtered fun graphics. Optional must-have force-
     injected (front-most free zone) if valid + harmonious.
- **`harmony.ts`** — WCAG-style luminance/contrast gate keyed on hoodie color,
  using each graphic's `dominantColors[]`. Rejects low-contrast pairings
  (white-on-white, dark-on-black). Preferred colorways: bone→bold/black-outline,
  black→white/cream/neon, grey→mid–high contrast, white→bold/dark.
- **`zones.ts`** — assign surviving candidates to patch zones in priority order
  (front_chest → back_upper → sleeves), enforce uniqueness + cap, attach per-zone
  default `scale`/`rotationDeg`.
- **`schema.ts`** — zod `DesignSpec` + invariant validator. Engine must **always**
  emit a spec that passes; failure to do so is a bug.
- **`rationale.ts`** — deterministic one-line "why we picked this" template (later
  optionally replaced by LLM curation).

Determinism: same inputs → identical spec (no `Math.random`/time in engine).

## 7. Questionnaire (5 questions, mobile-first, ~20s)

1. **Hoodie color** — bone · black · grey · white.
2. **Team(s)** — multi-select + drag-rank; "No team / Summer League fan" option.
3. **How much design?** — Clean (`minimal`) · Balanced · Loaded (`maximal`).
4. **Vibe** — Classic/Minimal · Vegas/Party · Bold/Streetwear · Playful/Fun →
   maps to a **mood** filter over the themed graphics.
5. **Optional must-have** — one pick from a curated tray (martini, Welcome to
   Vegas, flamingo, "ALL IN", …).

**Mood taxonomy:** every themed graphic tagged with one or more of
`classic | vegas | streetwear | playful`; Q4 selects preferred moods; the engine
weights candidates by mood match.

## 8. 3D Hoodie (R3F + drei)

**Model sourcing** (you asked to use the PDF hoodie's look; my discretion):
1. **Primary:** source a clean **CC0 / commercial-safe pullover-hoodie GLB**
   matching the PDF silhouette (pullover + hood + kangaroo pocket), apply the 4
   exact colors at runtime — reliable UVs ⇒ clean decals + premium fleece PBR.
2. **Experimental upgrade:** **Meshy image-to-3D** from PDF 3 Step-1 hoodie for an
   exact match; adopt only if UVs/topology are decal-friendly.
3. **Fallback:** parametric placeholder hoodie to unblock zone/decal work.
   → **Candidate model shown for approval before committing.**

**Rendering:** `useGLTF`; base color on a PBR `meshStandardMaterial`/
`meshPhysicalMaterial` keeping fabric normal/roughness; logos via drei `<Decal>`
(`meshStandardMaterial map={tex} transparent polygonOffset
polygonOffsetFactor={-1}`), textures via `useTexture`. One decal for the back
graphic + N for patches. `<Environment>` preset + soft `<ContactShadows>` +
key/fill (or `<Stage>`), `<Center>`/`<Bounds>` framing, `<OrbitControls
autoRotate>`.

**Zones → 3D:** `PLACEMENT_ZONES` map of `{position,rotation,scale}` per zone,
calibrated **once** against the GLB via a **dev-only tool** (`<Decal debug>` +
raycast `onClick` reading `intersection.point/.normal/.uv`).

**Performance/mobile:** draco/meshopt compression, `dpr={[1,2]}`, lazy textures,
`frameloop="demand"` when idle, Suspense fallbacks, downscaled decal textures.

## 9. Asset Pipeline (`assets/`, build step, runs before 3D)

Python (PyMuPDF + Pillow + numpy; optional `rembg`): render high-DPI →
grid-cell crop (bounds tuned per PDF after inspecting `assets/raw/*.png`) →
**edge flood-fill alpha** (preserves interior whites) → auto-trim → square-pad →
**1024²** PNG (+ optional 512), named to catalog `id` → sample `dominantColors[]`
→ emit **`catalog.json`** (`id → {file, label, team?, category, mood,
dominantColors[]}`), the **canonical** id↔item↔metadata map the engine reads.

- NBA team marks **upgraded to official vectors where available**; otherwise
  cropped and **flagged for softness** before anything physical ships.
- QA: contact sheet eyeballed; transparency clean on **black AND white**; counts
  match the PDFs (33 back / 94 placement); `dominantColors[]` populated.

## 10. Brand & Design System

Locked tokens: blue **`#2845E7`**, bg **`#000000`**, surfaces near-black; type
**Poppins (UI/body)** + **Clash Display (headlines)**; LiveX wordmark = exact SVG.
Dark, gradient-forward, premium; NBA Summer League × Vegas energy via motion +
accent, **never overriding brand blue**. Tokens persisted in a design-system file
(Tailwind theme + CSS variables) so every screen stays consistent. ui-ux-pro-max
seeds the system from these locked tokens; frontend-design drives the premium fan
UI. Mobile-first, large tap targets, smooth transitions.

## 11. Architecture / File Layout

```
app/
  layout.tsx, page.tsx          questionnaire → result flow
  api/generate/route.ts         thin: validate input → engine.generate() → DesignSpec
lib/
  catalog/                      typed catalogs + generated catalog.json loader
    hoodie-colors.ts, back-graphics.ts, placement-graphics.ts, zones.ts
  engine/                       select.ts harmony.ts zones.ts schema.ts rationale.ts
  three/                        HoodieScene, Decal wrapper, zone map, dev calibration
  store/                        DesignStore interface + LocalJsonStore (M1)
  curation/                     Curator interface + IdentityCurator (M1)
components/                     questionnaire steps, result panel (branded)
styles/                        design-system tokens (Tailwind theme + CSS vars)
assets/                        crop-all pipeline → logos/*.png + catalog.json
docs/superpowers/specs/        this spec, then the plan
public/models/                 hoodie.glb (draco)
```
Engine is the framework-free core; API route + 3D scene are thin consumers.

## 12. Service Seams (built in M1, inert by default)

- **Persistence:** `DesignStore` interface; **`LocalJsonStore`** is the M1 default.
  Supabase implementation lands in a later milestone (free project available).
- **Curation:** `Curator` interface; **`IdentityCurator`** (returns the
  deterministic spec) is the M1 default. OpenRouter implementation later, **behind
  `ENABLE_LLM_CURATION` (default false)**, server-side only, schema-validated with
  deterministic fallback, using **free models** with live-ID verification.
- **Secrets:** server-side env only. `.env.example` documents `OPENROUTER_API_KEY`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ENABLE_LLM_CURATION=false`. No secrets in
  client or git.

## 13. Testing Strategy (Vitest)

- **Schema/invariants:** each hard invariant from §5 (positive + negative cases).
- **Harmony:** table-driven per hoodie color (reject white-on-white, dark-on-black;
  accept high-contrast).
- **Engine:** determinism; density caps (minimal/balanced/maximal); multi-team →
  back + sleeves; no-team → SL/Vegas back; no duplicate zone; must-have injection;
  vibe→mood filtering.
- **Catalog integrity:** counts (33 back / 94 placement); every catalog id has a
  `catalog.json` entry + file; zones well-formed; back zone is `back_center` only.
- **Gates:** ESLint + `tsc --noEmit` clean.

## 14. Quality Gates & Workflow

Work on `feat/core-spine` (+ git worktree for implementation). **TDD on the
engine.** Small **conventional commits**. Superpowers **two-stage review** (spec
compliance → code quality) before "done." `CLAUDE.md` captures stack, verified
brand tokens, catalog/zone model, hard constraints (one back graphic,
approved-graphics-only, valid zones), run/build/test commands, and
patterns-to-avoid. Ask before any destructive/irreversible action.

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Team-crop softness on a physical garment | Upgrade to official vectors where available; **flag** remaining crops (you chose crop-all). |
| GLB UVs/topology unfit for decals | Primary = vetted CC0 model; Meshy only if clean; placeholder fallback; approve candidate first. |
| Exact catalog `id↔item` mapping errors | Locked by QA'd asset pipeline vs the PDF, not guessed in code. |
| OpenRouter free-model volatility | Off in M1; later behind flag, live-ID check, schema validation, deterministic fallback. |
| Trademark (NBA marks on a product) | Used only under the NBA partnership rights; official assets preferred over crops. |

## 16. Definition of Done (Milestone 1)

- Fan completes the 5-question flow; engine returns a `DesignSpec` passing **all**
  §5 invariants (enforced + unit-tested).
- 3D hoodie renders correct color + the one back graphic + placement patches on
  the **correct PDF zones**, auto-rotates, looks premium on mobile + desktop.
- Asset pipeline produced the 127 PNGs + `catalog.json` (QA'd; team softness
  flagged).
- Brand tokens **verified** + locked; design-system file persisted.
- `CLAUDE.md`, `README.md`, tests, lint, typecheck — present and **passing**.
- App works **fully without any external API calls.**

---

### Appendix A — Source PDFs
- `Summer League Colors and Back Graphics.pdf` → hoodie colors + back graphics 1–33.
- `NBA Summer League 2026 Grid for Approval.pdf` → placement graphics 1–94.
- `NBA Patch Options.pdf` → Step 1 hoodies (4), **Step 2 zone maps (9 & 11)**,
  Step 3 back patch, Step 4 sleeve patches. ("ONLY USE STEP 2" for zones.)

### Appendix B — Density → patch budget
`minimal` 0–1 (target 1) · `balanced` 2–4 (target 3) · `maximal` 6–10 (target 8),
clamped to available harmonious patch zones (max 10).
