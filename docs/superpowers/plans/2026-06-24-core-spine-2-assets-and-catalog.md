# Core Spine — Plan 2: Assets & Catalog — Implementation Plan

> **For agentic workers:** the asset-production phase (A) was executed hands-on by the controller (iterative visual work). The wiring phase (B) is executed via superpowers:subagent-driven-development with per-task review.

**Goal:** Replace the seed catalog with the full PDF-extracted catalog — 127 transparent decal PNGs + `assets/catalog.json` (id → file, label, category, mood, team, dominantColors) — wired into the engine, with the full 33/94 catalog and all integrity tests green.

**Tech Stack:** Python (PyMuPDF + Pillow + numpy) for extraction; TypeScript catalog loaders read `assets/catalog.json`.

## Global Constraints (carried from Plan 1 + spec)
- Catalog counts: **33 back**, **94 placement**. Zones unchanged (PDF-faithful, no hood).
- Every graphic: valid 6-hex `dominantColors`, a servable `file`, unique `id`. Team slugs link a franchise; exactly one placement entry per franchise carries `team`.
- Engine stays deterministic; secrets server-side; app works with zero external calls. TS strict; tsc/ESLint/Vitest clean.
- Decal textures optimized for web (quantized; back 1024², placement 512²).

---

## Phase A — Asset production (DONE, controller-executed)

1. **`assets/extract.py`** — renders the two source PDFs @300 DPI, detects grid geometry (verified: back 8×5, placement 8×12), crops each cell's logo region (grid lines exclude the number strip), edge-flood-fills the outer white to transparency (interior whites preserved), auto-trims + square-pads, samples dominant colours. Output: `public/logos/{back,placement}/NN.png` + `assets/extract_raw.json`.
2. **`assets/build_catalog.py`** — merges human-verified labels (authored by inspecting `assets/contact_*.png`) with the sampled colours, renames PNGs to self-descriptive `<id>.png`, emits **`assets/catalog.json`**. Verified: 33 back (29 teams — Chicago Bulls intentionally back-absent per the PDF), 94 placement (all 30 franchises; alternates knicks-wordmark/The-Bay/lakers-wordmark/celtics-alt are team-less so `teamPatch` stays unique), 127 unique ids.
3. **Optimization** — quantized + downscaled: 46 MB → 6.2 MB. QA: all 127 RGBA with clean transparency; hero decals crisp at 1024².

**Continuity:** every seed id from Plan 1 maps to a real catalog id (back_07_celtics, plc_40_flamingo, …), so Plan-1 engine tests survive the swap **except** the synthetic `plc_90_eclipse` (now real `plc_90_magic`). Verified real low-contrast replacement: **`plc_25_star-yellow` fails harmony on a `white` hoodie** (and bone).

---

## Phase B — Wiring (subagent-driven, TDD)

### Task 1: Add `file` to `Graphic`; load full catalog from `catalog.json`; fix the two `plc_90_eclipse` tests

**Files:**
- Modify: `lib/catalog/types.ts` (add `file: string` to `Graphic`)
- Replace: `lib/catalog/back-graphics.ts`, `lib/catalog/placement-graphics.ts` (load from `@/assets/catalog.json` instead of the seed arrays)
- Modify: `tests/schema.test.ts`, `tests/select.test.ts` (replace `plc_90_eclipse` with the real low-contrast case)
- Verify: `tsconfig.json` has `resolveJsonModule` (Next sets it; confirm)

**Interfaces:**
- Produces: `BACK_GRAPHIC_CATALOG`/`PLACEMENT_GRAPHIC_CATALOG` now the full 33/94 `Graphic[]` (each with `file`). All existing lookups (`backById`, `teamPatch`, …) unchanged in signature.

- [ ] **Step 1: Add `file: string` to the `Graphic` interface** in `lib/catalog/types.ts`.

- [ ] **Step 2: Replace `lib/catalog/back-graphics.ts`** to load from the JSON:

```ts
import type { Graphic } from './types';
import catalog from '@/assets/catalog.json';
export const BACK_GRAPHIC_CATALOG: Graphic[] = catalog.back as Graphic[];
```
And `lib/catalog/placement-graphics.ts`:
```ts
import type { Graphic } from './types';
import catalog from '@/assets/catalog.json';
export const PLACEMENT_GRAPHIC_CATALOG: Graphic[] = catalog.placement as Graphic[];
```
If TS rejects the cast due to the extra `num` field or `mood`/`category` widening, use `as unknown as Graphic[]` (the integrity test in Task 2 validates shape at runtime). Confirm `resolveJsonModule: true` in `tsconfig.json` — add it if missing.

- [ ] **Step 3: Run the suite to see exactly what breaks.** Run `npm test`. Expect failures ONLY in `tests/schema.test.ts` and `tests/select.test.ts` (the `plc_90_eclipse` references). If anything else fails, STOP and report — it signals an unexpected catalog/engine coupling.

- [ ] **Step 4: Fix the low-contrast test in `tests/schema.test.ts`.** The current low-contrast case builds a `black`-hoodie spec with `plc_90_eclipse` (no longer real). Replace it with a real low-contrast pairing — `plc_25_star-yellow` on a `white` hoodie:

```ts
  it('rejects a low-contrast patch (yellow star on white)', () => {
    const s: DesignSpec = {
      ...valid, hoodieColor: 'white',
      backGraphic: { id: 'back_01_las-vegas-summer-league', zone: 'back_center' },
      patches: [{ id: 'plc_25_star-yellow', zone: 'front_chest', scale: 0.5, rotationDeg: 0 }],
    };
    expect(checkInvariants(s).some(e => e.startsWith('low-contrast patch'))).toBe(true);
  });
```
(Adjust the surrounding `valid` fixture references as needed so the spec is otherwise valid.)

- [ ] **Step 5: Fix the harmony-filter assertion in `tests/select.test.ts`.** Replace the `plc_90_eclipse` exclusion with a data-independent property check plus the real case:

```ts
  it('filters out low-contrast candidates for the chosen hoodie', () => {
    const out = buildCandidates({ hoodieColor: 'white', teamsRanked: [], density: 'maximal', vibe: 'playful' });
    // every surviving candidate must be harmonious on white
    for (const id of out) {
      const g = placementById(id)!;
      expect(isHarmonious('white', g.dominantColors)).toBe(true);
    }
    expect(out).not.toContain('plc_25_star-yellow'); // concrete real low-contrast item on white
  });
```
Import `placementById` and `isHarmonious` in the test if not already present. Keep the other select tests (they reference ids that still exist).

- [ ] **Step 6: Run the full gate.** `npm test` (all green), `npm run typecheck`, `npm run lint`, `npm run build`. Commit:
```bash
git add -A && git commit -m "feat: load full PDF-extracted catalog (33/94) into the engine"
```

### Task 2: Catalog-integrity tests; apply Plan-1 follow-ups; docs

**Files:**
- Create: `tests/catalog-full.test.ts`, `assets/README.md`
- Modify: `lib/engine/harmony.ts` (6-hex guard), `lib/engine/select.ts` + `lib/engine/schema.ts` (back-graphic harmony), `CLAUDE.md`, `README.md`

- [ ] **Step 1: Write `tests/catalog-full.test.ts`** asserting against the real catalog: exactly 33 back + 94 placement; every entry has a non-empty `file` starting `/logos/`, a `label`, ≥1 `mood`, ≥1 `dominantColors` all matching `/^#[0-9A-Fa-f]{6}$/`; all 127 ids unique; placement contains all 30 franchise slugs with `team` set exactly once each; back contains 29 team slugs (no `bulls`). Also assert every `file` exists on disk under `public/` (read via `node:fs`).

- [ ] **Step 2: Apply Plan-1 follow-up — `luminance()` hex guard** in `lib/engine/harmony.ts`: throw a clear error if a colour is not 6-hex, so a malformed pipeline colour fails loud instead of NaN-silent. Add a unit test.

- [ ] **Step 3: Apply Plan-1 follow-up — back-graphic harmony.** Now that 29 real team logos can land on the back, ensure the hero reads. In `resolveBack`, if the chosen team back graphic is NOT harmonious on the hoodie, still use it (team identity wins) BUT record nothing — instead add a soft check in `checkInvariants` that the back graphic harmonises, reported as a NON-fatal warning channel? **Decision:** keep hard invariants unchanged (back is always the team's logo — identity must win); add a `backGraphicHarmonious(spec)` helper + test documenting the contrast, and surface it in the rationale only. Do NOT reject a low-contrast back (would break "exactly the #1 team on the back"). Keep this minimal and documented.

- [ ] **Step 4: Write `assets/README.md`** documenting the pipeline (`extract.py` → `build_catalog.py` → `catalog.json`), the grid geometry, the optimization, and how to regenerate (needs the source PDFs, not committed).

- [ ] **Step 5: Update `CLAUDE.md` + `README.md`** — catalog is now the full 33/94 from `catalog.json` (seed retired); note `Graphic.file`; note Chicago-Bulls-back-absent.

- [ ] **Step 6: Full gate + commit.** `npm test`, typecheck, lint, build all green.
```bash
git add -A && git commit -m "test: catalog integrity; harden harmony; assets + docs"
```

---

## Definition of Done (Plan 2)
- `assets/catalog.json` + 127 optimized PNGs committed; pipeline scripts documented.
- Engine reads the full 33/94 catalog; all tests (incl. new integrity tests) green; typecheck, lint, build clean.
- Plan-1 latent follow-ups (luminance guard) addressed; back-graphic harmony documented.
- App still works with zero external calls; determinism preserved.
