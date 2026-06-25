# Core Spine — Plan 1: Foundation & Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js project and a fully tested, deterministic rules engine that turns 5 questionnaire answers into a schema-valid, manufacturable `DesignSpec`, served behind `/api/generate`, inside a branded LiveX shell.

**Architecture:** A framework-free engine core (`lib/engine/`) — schema/validator, color-harmony gate, zone assignment, candidate selection, rationale, orchestrator — consumed by a thin API route. Catalog data (`lib/catalog/`) is typed; Plan 1 ships a hand-authored **seed** subset that Plan 2 replaces with the PDF-generated `catalog.json`. Persistence and LLM curation exist only as inert interface seams.

**Tech Stack:** Next.js 15 (App Router, TypeScript strict) · React 19 · Tailwind CSS · Zod · Vitest · ESLint/Prettier · Node 22.

## Global Constraints

- **Brand (verified, locked):** primary blue `#2845E7`; background `#000000`; UI/body font **Poppins**; display font **Archivo** (athletic grotesque, loaded via `next/font/google`); the LiveX wordmark is always the exact SVG, never re-typeset.
- **Hard invariants (every generated spec):** exactly one back graphic, `zone === "back_center"`; all graphic IDs ∈ catalog; every patch zone ∈ patch-zone set and **never** `back_center`; **no duplicate patch zone**; patch count ≤ density cap; color-harmony passes for every patch vs hoodie color; `scale`/`rotationDeg` in range.
- **Zones are PDF-faithful (PDF 3 Step 2):** `back_center`, `front_chest`, `back_upper`, `left_sleeve_1..4`, `right_sleeve_1..4`. **No `hood` zone. One `front_chest`** (not left/right).
- **Density caps:** `minimal` 0–1 (target 1) · `balanced` 2–4 (target 3) · `maximal` 6–10 (target 8). Questionnaire "Loaded" → `maximal`.
- **Secrets server-side only.** `ENABLE_LLM_CURATION` defaults `false`. **The app works with zero external API calls.**
- **Engine is deterministic:** no `Math.random`, no time, no IO. Same input → identical spec.
- **Quality gates:** TypeScript strict; `tsc --noEmit`, ESLint, and Vitest all clean before any task is "done." Conventional commits, one per task.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs,
  vitest.config.ts, eslint.config.mjs, .env.example, .gitignore
  (Tailwind v4: brand theme lives in app/globals.css @theme — no tailwind.config.ts)
app/
  layout.tsx                 root layout: fonts + brand shell
  page.tsx                   placeholder landing (real flow in Plan 3)
  globals.css                Tailwind + brand CSS variables
  api/generate/route.ts      POST: validate answers → engine.generate() → DesignSpec
lib/
  catalog/
    types.ts                 shared domain types (single source of truth)
    hoodie-colors.ts         HOODIE_COLORS (4) + fabric hex
    zones.ts                 BACK_ZONE, PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS
    back-graphics.ts         BACK_GRAPHIC_CATALOG (seed subset in Plan 1)
    placement-graphics.ts    PLACEMENT_GRAPHIC_CATALOG (seed subset in Plan 1)
    index.ts                 catalog lookups: byId, teamBackGraphic, teamPatch
  engine/
    harmony.ts               isHarmonious(hoodie, dominantColors)
    schema.ts                zod DesignSpec + checkInvariants()
    zones.ts                 assignZones(orderedIds, budget)
    select.ts                resolveBack(), buildCandidates(), densityBudget()
    rationale.ts             buildRationale()
    generate.ts              generate(answers): DesignSpec  (orchestrator)
  store/
    design-store.ts          DesignStore interface + LocalJsonStore (M1 default)
  curation/
    curator.ts               Curator interface + IdentityCurator (M1 default)
tests/
  catalog.test.ts, harmony.test.ts, schema.test.ts, zones.test.ts,
  select.test.ts, rationale.test.ts, generate.test.ts, api-generate.test.ts,
  seams.test.ts
CLAUDE.md, README.md
```

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.eslintrc.json`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Next.js app (`npm run dev`), a green test runner (`npm test`), `npm run lint`, `npm run typecheck`.

- [ ] **Step 1: Scaffold Next.js in-place.** The repo already contains `.git/` and `docs/`; `create-next-app` preserves unknown dirs.

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --use-npm --no-turbopack
```
If it refuses due to existing files, scaffold in a temp dir and merge:
```bash
npx create-next-app@latest /tmp/livex-scaffold --typescript --tailwind --eslint \
  --app --no-src-dir --import-alias "@/*" --use-npm --no-turbopack
rsync -a --ignore-existing /tmp/livex-scaffold/ ./
```

- [ ] **Step 2: Add test/typecheck deps and scripts.**

Run:
```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npm i zod
```
Edit `package.json` `"scripts"` to include:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create `vitest.config.ts`.**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', globals: true, include: ['tests/**/*.test.ts?(x)'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
});
```

- [ ] **Step 4: Ensure `tsconfig.json` is strict.** Confirm `"strict": true` and the `"@/*"` path alias exist (create-next-app sets both). Add `"noUncheckedIndexedAccess": true` to `compilerOptions`.

- [ ] **Step 5: Create `.env.example`.**

```bash
# All optional in Milestone 1 — the app works with zero external calls.
ENABLE_LLM_CURATION=false
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

- [ ] **Step 6: Smoke-test the toolchain.** Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
describe('toolchain', () => { it('runs', () => expect(1 + 1).toBe(2)); });
```

Run: `npm test`
Expected: 1 passing test.
Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest, Tailwind, strict TS"
```

---

### Task 2: Brand design system (Tailwind v4 theme + fonts + shell)

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: Task 1 scaffold (**Tailwind v4** — CSS-based config; there is no `tailwind.config.ts`).
- Produces: Tailwind v4 theme utilities (`bg-brand`, `text-ink`, `bg-surface`, `font-display`, `font-sans`…) generated from `@theme`, the `--lx-glow` CSS variable, Poppins + Archivo loaded, a dark branded shell. **Removes all `create-next-app` boilerplate** (white `--background`, dark-mode media query, Arial body font, Geist fonts, default metadata, marketing links).

- [ ] **Step 1: Replace `app/globals.css` entirely.** Tailwind v4 defines theme tokens in CSS via `@theme` (no JS config). This also deletes the scaffold's white `--background`, dark-mode media query, and Arial body font.

```css
@import "tailwindcss";

@theme {
  --color-brand: #2845E7;          /* verified from livex new logo blue.svg */
  --color-brand-deep: #0A2A66;
  --color-bg: #000000;
  --color-surface: #0B0D14;
  --color-surface-raised: #12151F;
  --color-ink: #F5F7FA;
  --color-ink-muted: #9AA3B2;
  --color-line: #1E2230;
  --font-sans: var(--font-poppins), system-ui, sans-serif;
  --font-display: var(--font-archivo), var(--font-poppins), sans-serif;
}

:root {
  --lx-glow: radial-gradient(60% 60% at 50% 0%, rgba(40, 69, 231, 0.45), transparent 70%);
}

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Replace `app/layout.tsx` entirely** — load Poppins + Archivo via `next/font/google` (no manual font files) and set brand metadata. This removes the scaffold's Geist fonts and "Create Next App" metadata.

```tsx
import type { Metadata } from 'next';
import { Poppins, Archivo } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: 'NBA Summer League × LiveX — Design Your Drop',
  description: 'Design your custom NBA Summer League hoodie.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${archivo.variable}`}>
      <body className="min-h-dvh bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx` entirely** with a branded shell that proves tokens + fonts render (the real flow arrives in Plan 3). This removes the scaffold's marketing links.

```tsx
export default function Home() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <div className="relative text-center">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-ink-muted">NBA Summer League × LiveX</p>
        <h1 className="font-display text-5xl font-semibold text-ink sm:text-7xl">Design Your Drop</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-ink-muted">
          Answer five quick questions. We design your hoodie.
        </p>
        <span className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-sans font-semibold text-white">
          Coming together…
        </span>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify.** Run `npm run build` (NOT `npm run dev` — it never exits). Build must succeed. Run `npm run lint` and `npm run typecheck` — both clean. Confirm no boilerplate remains: `grep -riE 'geist|create next app|vercel\.com|#ffffff' app/` returns nothing.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "feat: brand design system — verified LiveX tokens (Tailwind v4), Poppins + Archivo"
```

---

### Task 3: Catalog types, hoodie colors, zones, seed catalog

**Files:**
- Create: `lib/catalog/types.ts`, `lib/catalog/hoodie-colors.ts`, `lib/catalog/zones.ts`, `lib/catalog/back-graphics.ts`, `lib/catalog/placement-graphics.ts`, `lib/catalog/index.ts`, `tests/catalog.test.ts`

**Interfaces:**
- Consumes: nothing (pure data).
- Produces:
  - Types: `HoodieColor`, `Density`, `Vibe`, `Mood`, `BackZone`, `PatchZone`, `GraphicCategory`, `Graphic`, `HoodieColorDef`, `QuestionnaireAnswers`, `DesignSpec`.
  - `HOODIE_COLORS: HoodieColorDef[]`, `FABRIC_HEX: Record<HoodieColor,string>`.
  - `BACK_ZONE='back_center'`, `PATCH_ZONE_PRIORITY: PatchZone[]` (10), `ZONES_9: PatchZone[]` (8), `ZONE_DEFAULTS: Record<PatchZone,{scale:number;rotationDeg:number}>`.
  - `BACK_GRAPHIC_CATALOG: Graphic[]`, `PLACEMENT_GRAPHIC_CATALOG: Graphic[]`.
  - Lookups: `backById(id)`, `placementById(id)`, `teamBackGraphic(slug)`, `teamPatch(slug)`, `placementByCategory(cat)`, `placementByMood(mood)`.

- [ ] **Step 1: Write the failing test** `tests/catalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { HOODIE_COLORS, FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import { BACK_ZONE, PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS } from '@/lib/catalog/zones';
import { BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG } from '@/lib/catalog';
import { teamBackGraphic, teamPatch, placementByMood } from '@/lib/catalog';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('catalog', () => {
  it('has 4 hoodie colors, each with a fabric hex', () => {
    expect(HOODIE_COLORS.map(c => c.id).sort()).toEqual(['black','bone','grey','white']);
    for (const c of HOODIE_COLORS) expect(FABRIC_HEX[c.id]).toMatch(HEX);
  });
  it('back zone is back_center; 10 patch zones; 9-zone is the 8-zone subset', () => {
    expect(BACK_ZONE).toBe('back_center');
    expect(PATCH_ZONE_PRIORITY).toHaveLength(10);
    expect(PATCH_ZONE_PRIORITY).not.toContain('back_center');
    expect(new Set(PATCH_ZONE_PRIORITY).size).toBe(10);
    expect(ZONES_9).toHaveLength(8);
    expect(ZONES_9.every(z => PATCH_ZONE_PRIORITY.includes(z))).toBe(true);
    for (const z of PATCH_ZONE_PRIORITY) expect(ZONE_DEFAULTS[z]).toBeTruthy();
  });
  it('every graphic has id/label/category/mood/dominantColors; ids unique within catalog', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.id).toMatch(/^\w/);
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.mood.length).toBeGreaterThan(0);
      expect(g.dominantColors.length).toBeGreaterThan(0);
      for (const c of g.dominantColors) expect(c).toMatch(HEX);
    }
    const backIds = BACK_GRAPHIC_CATALOG.map(g => g.id);
    const plcIds = PLACEMENT_GRAPHIC_CATALOG.map(g => g.id);
    expect(new Set(backIds).size).toBe(backIds.length);
    expect(new Set(plcIds).size).toBe(plcIds.length);
  });
  it('team lookups resolve a seeded team in both catalogs', () => {
    expect(teamBackGraphic('celtics')?.team).toBe('celtics');
    expect(teamPatch('celtics')?.team).toBe('celtics');
    expect(placementByMood('vegas').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/catalog.test.ts` — Expected: FAIL (modules not found).

- [ ] **Step 3: Create `lib/catalog/types.ts`.**

```ts
export type HoodieColor = 'bone' | 'black' | 'grey' | 'white';
export type Density = 'minimal' | 'balanced' | 'maximal';
export type Vibe = 'classic' | 'vegas' | 'streetwear' | 'playful';
export type Mood = 'classic' | 'vegas' | 'streetwear' | 'playful';
export type BackZone = 'back_center';
export type PatchZone =
  | 'front_chest' | 'back_upper'
  | 'left_sleeve_1' | 'left_sleeve_2' | 'left_sleeve_3' | 'left_sleeve_4'
  | 'right_sleeve_1' | 'right_sleeve_2' | 'right_sleeve_3' | 'right_sleeve_4';
export type GraphicCategory =
  | 'summer_league' | 'vegas' | 'nba_league' | 'conference' | 'team' | 'city_text' | 'fun';

export interface Graphic {
  id: string; label: string; category: GraphicCategory;
  mood: Mood[]; dominantColors: string[]; team?: string;
}
export interface HoodieColorDef { id: HoodieColor; label: string; hex: string; }
export interface QuestionnaireAnswers {
  hoodieColor: HoodieColor; teamsRanked: string[];
  density: Density; vibe: Vibe; mustHaveId?: string;
}
export interface DesignSpec {
  hoodieColor: HoodieColor;
  backGraphic: { id: string; zone: BackZone };
  patches: Array<{ id: string; zone: PatchZone; scale: number; rotationDeg: number }>;
  densityTier: Density;
  rationale: string;
  meta: { favoriteTeamsRanked: string[]; vibe: string; schemaVersion: '1.0' };
}
```

- [ ] **Step 4: Create `lib/catalog/hoodie-colors.ts`.**

```ts
import type { HoodieColor, HoodieColorDef } from './types';
export const HOODIE_COLORS: HoodieColorDef[] = [
  { id: 'bone',  label: 'Bone',  hex: '#EDE6D6' },
  { id: 'black', label: 'Black', hex: '#1B1B1B' },
  { id: 'grey',  label: 'Grey',  hex: '#9B9FA4' },
  { id: 'white', label: 'White', hex: '#F7F7F5' },
];
export const FABRIC_HEX: Record<HoodieColor, string> =
  Object.fromEntries(HOODIE_COLORS.map(c => [c.id, c.hex])) as Record<HoodieColor, string>;
```

- [ ] **Step 5: Create `lib/catalog/zones.ts`.**

```ts
import type { BackZone, PatchZone } from './types';
export const BACK_ZONE: BackZone = 'back_center';
// Priority = fill order (front first, then sleeves alternating L/R for balance).
export const PATCH_ZONE_PRIORITY: PatchZone[] = [
  'front_chest', 'back_upper',
  'left_sleeve_1', 'right_sleeve_1',
  'left_sleeve_2', 'right_sleeve_2',
  'left_sleeve_3', 'right_sleeve_3',
  'left_sleeve_4', 'right_sleeve_4',
];
// 9-zone orientation = drop the 4th sleeve position each side.
export const ZONES_9: PatchZone[] = PATCH_ZONE_PRIORITY.filter(
  z => z !== 'left_sleeve_4' && z !== 'right_sleeve_4',
);
export const ZONE_DEFAULTS: Record<PatchZone, { scale: number; rotationDeg: number }> = {
  front_chest:    { scale: 0.55, rotationDeg: 0 },
  back_upper:     { scale: 0.45, rotationDeg: 0 },
  left_sleeve_1:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_2:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_3:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_4:  { scale: 0.40, rotationDeg: 0 },
  right_sleeve_1: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_2: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_3: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_4: { scale: 0.40, rotationDeg: 0 },
};
```

- [ ] **Step 6: Create seed `lib/catalog/back-graphics.ts`.** (Plan 2 regenerates from `catalog.json`; this seed is a clearly-labeled subset so the engine is testable now.)

```ts
import type { Graphic } from './types';
// SEED SUBSET — replaced by the PDF-generated catalog in Plan 2.
export const BACK_GRAPHIC_CATALOG: Graphic[] = [
  { id: 'back_01_las-vegas-summer-league', label: 'Las Vegas Summer League', category: 'summer_league', mood: ['vegas','classic'], dominantColors: ['#C8102E','#1D428A','#FFFFFF'] },
  { id: 'back_03_nba', label: 'NBA', category: 'nba_league', mood: ['classic'], dominantColors: ['#1D428A','#C8102E','#FFFFFF'] },
  { id: 'back_07_celtics', team: 'celtics', label: 'Boston Celtics', category: 'team', mood: ['classic'], dominantColors: ['#007A33','#FFFFFF'] },
  { id: 'back_09_mavericks', team: 'mavericks', label: 'Dallas Mavericks', category: 'team', mood: ['classic'], dominantColors: ['#00538C','#002B5E'] },
  { id: 'back_12_warriors', team: 'warriors', label: 'Golden State Warriors', category: 'team', mood: ['classic'], dominantColors: ['#1D428A','#FFC72C'] },
];
```

- [ ] **Step 7: Create seed `lib/catalog/placement-graphics.ts`.**

```ts
import type { Graphic } from './types';
// SEED SUBSET — replaced by the PDF-generated catalog in Plan 2.
export const PLACEMENT_GRAPHIC_CATALOG: Graphic[] = [
  { id: 'plc_01_martini', label: 'Martini', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#0A0A0A','#7CFC00'] },
  { id: 'plc_03_welcome-to-las-vegas', label: 'Welcome to Las Vegas', category: 'vegas', mood: ['vegas'], dominantColors: ['#E03A3E','#1D428A','#FFD200'] },
  { id: 'plc_05_basketball', label: 'Basketball', category: 'fun', mood: ['classic','streetwear'], dominantColors: ['#EE6730','#000000'] },
  { id: 'plc_40_flamingo', label: 'Flamingo', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#FF6FA5','#FF9CC0'] },
  { id: 'plc_49_las-vegas-summer-league', label: 'Las Vegas Summer League', category: 'summer_league', mood: ['vegas','classic'], dominantColors: ['#1D428A','#E03A3E'] },
  { id: 'plc_54_cactus', label: 'Cactus', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#4C9A2A'] },
  { id: 'plc_62_hawks', team: 'hawks', label: 'Atlanta Hawks', category: 'team', mood: ['classic','streetwear'], dominantColors: ['#E03A3E','#26282A'] },
  { id: 'plc_64_celtics', team: 'celtics', label: 'Boston Celtics', category: 'team', mood: ['classic'], dominantColors: ['#007A33','#FFFFFF'] },
  { id: 'plc_66_mavericks', team: 'mavericks', label: 'Dallas Mavericks', category: 'team', mood: ['classic'], dominantColors: ['#00538C'] },
  { id: 'plc_69_warriors', team: 'warriors', label: 'Golden State Warriors', category: 'team', mood: ['classic'], dominantColors: ['#1D428A','#FFC72C'] },
  // near-black graphic for harmony-rejection tests on black fabric:
  { id: 'plc_90_eclipse', label: 'Eclipse', category: 'fun', mood: ['streetwear'], dominantColors: ['#0A0A0A','#161616'] },
];
```

- [ ] **Step 8: Create `lib/catalog/index.ts`** (lookups).

```ts
import type { Graphic, GraphicCategory, Mood } from './types';
import { BACK_GRAPHIC_CATALOG } from './back-graphics';
import { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';
export { BACK_GRAPHIC_CATALOG } from './back-graphics';
export { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';
export * from './types';

export const backById = (id: string): Graphic | undefined => BACK_GRAPHIC_CATALOG.find(g => g.id === id);
export const placementById = (id: string): Graphic | undefined => PLACEMENT_GRAPHIC_CATALOG.find(g => g.id === id);
export const teamBackGraphic = (slug: string): Graphic | undefined =>
  BACK_GRAPHIC_CATALOG.find(g => g.team === slug);
export const teamPatch = (slug: string): Graphic | undefined =>
  PLACEMENT_GRAPHIC_CATALOG.find(g => g.team === slug);
export const placementByCategory = (cat: GraphicCategory): Graphic[] =>
  PLACEMENT_GRAPHIC_CATALOG.filter(g => g.category === cat);
export const placementByMood = (mood: Mood): Graphic[] =>
  PLACEMENT_GRAPHIC_CATALOG.filter(g => g.mood.includes(mood));
```

- [ ] **Step 9: Run tests to verify pass.** Run: `npm test -- tests/catalog.test.ts` — Expected: PASS (all 4).

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat: catalog types, hoodie colors, PDF-faithful zones, seed catalog"
```

---

### Task 4: Color-harmony gate

**Files:**
- Create: `lib/engine/harmony.ts`, `tests/harmony.test.ts`

**Interfaces:**
- Consumes: `FABRIC_HEX`, `HoodieColor`.
- Produces: `isHarmonious(hoodie: HoodieColor, dominantColors: string[]): boolean`; `contrastRatio(hexA, hexB): number`.

- [ ] **Step 1: Write the failing test** `tests/harmony.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isHarmonious, contrastRatio } from '@/lib/engine/harmony';

describe('harmony', () => {
  it('contrastRatio is symmetric and ~21 for black/white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  });
  it('rejects dark-only graphic on black hoodie', () => {
    expect(isHarmonious('black', ['#0A0A0A', '#161616'])).toBe(false);
  });
  it('accepts a graphic with any high-contrast dominant color on black', () => {
    expect(isHarmonious('black', ['#0A0A0A', '#FFC72C'])).toBe(true);
  });
  it('rejects near-white graphic on white hoodie', () => {
    expect(isHarmonious('white', ['#F4F4F2'])).toBe(false);
  });
  it('grey hoodie accepts mid-to-high contrast', () => {
    expect(isHarmonious('grey', ['#1D428A'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/harmony.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/engine/harmony.ts`.**

```ts
import { FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import type { HoodieColor } from '@/lib/catalog/types';

const CONTRAST_THRESHOLD = 1.6; // a patch must have ≥1 dominant color this distinct from fabric

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}
export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexA), lb = luminance(hexB);
  const hi = Math.max(la, lb) + 0.05, lo = Math.min(la, lb) + 0.05;
  return hi / lo;
}
export function isHarmonious(hoodie: HoodieColor, dominantColors: string[]): boolean {
  const fabric = FABRIC_HEX[hoodie];
  return dominantColors.some(c => contrastRatio(c, fabric) >= CONTRAST_THRESHOLD);
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/harmony.test.ts` — Expected: PASS (all 5).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: WCAG-style color-harmony gate"
```

---

### Task 5: DesignSpec schema + invariant validator

**Files:**
- Create: `lib/engine/schema.ts`, `tests/schema.test.ts`

**Interfaces:**
- Consumes: catalog lookups (`backById`, `placementById`), `isHarmonious`, zones (`PATCH_ZONE_PRIORITY`), `FABRIC` types.
- Produces:
  - `designSpecSchema` (zod) — structural validation.
  - `checkInvariants(spec: DesignSpec): string[]` — returns a list of human-readable violations (empty = valid). Covers: back zone, IDs ∈ catalog, patch zones valid + unique + not back_center, density cap, harmony, scale/rotation range.
  - `DENSITY_MAX: Record<Density, number>`.

- [ ] **Step 1: Write the failing test** `tests/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { designSpecSchema, checkInvariants } from '@/lib/engine/schema';
import type { DesignSpec } from '@/lib/catalog/types';

const valid: DesignSpec = {
  hoodieColor: 'black',
  backGraphic: { id: 'back_07_celtics', zone: 'back_center' },
  patches: [{ id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.55, rotationDeg: 0 }],
  densityTier: 'minimal',
  rationale: 'ok',
  meta: { favoriteTeamsRanked: ['celtics'], vibe: 'vegas', schemaVersion: '1.0' },
};

describe('schema + invariants', () => {
  it('accepts a valid spec', () => {
    expect(designSpecSchema.safeParse(valid).success).toBe(true);
    expect(checkInvariants(valid)).toEqual([]);
  });
  it('rejects unknown back graphic id', () => {
    const s = { ...valid, backGraphic: { id: 'back_99_nope', zone: 'back_center' as const } };
    expect(checkInvariants(s)).toContain('backGraphic.id not in catalog: back_99_nope');
  });
  it('rejects a patch in back_center via schema enum', () => {
    const bad = { ...valid, patches: [{ id: 'plc_40_flamingo', zone: 'back_center', scale: 0.5, rotationDeg: 0 }] };
    expect(designSpecSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects duplicate patch zones', () => {
    const s: DesignSpec = { ...valid, densityTier: 'balanced', patches: [
      { id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
      { id: 'plc_05_basketball', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s)).toContain('duplicate patch zone: front_chest');
  });
  it('rejects exceeding density cap', () => {
    const s: DesignSpec = { ...valid, densityTier: 'minimal', patches: [
      { id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
      { id: 'plc_05_basketball', zone: 'back_upper', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s).some(e => e.startsWith('patch count'))).toBe(true);
  });
  it('rejects a low-contrast patch (eclipse on black)', () => {
    const s: DesignSpec = { ...valid, patches: [
      { id: 'plc_90_eclipse', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s).some(e => e.startsWith('low-contrast patch'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/schema.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/schema.ts`.**

```ts
import { z } from 'zod';
import type { DesignSpec, Density } from '@/lib/catalog/types';
import { PATCH_ZONE_PRIORITY } from '@/lib/catalog/zones';
import { backById, placementById } from '@/lib/catalog';
import { isHarmonious } from './harmony';

export const DENSITY_MAX: Record<Density, number> = { minimal: 1, balanced: 4, maximal: 10 };
const patchZoneEnum = z.enum(PATCH_ZONE_PRIORITY as [string, ...string[]]);

export const designSpecSchema = z.object({
  hoodieColor: z.enum(['bone', 'black', 'grey', 'white']),
  backGraphic: z.object({ id: z.string().min(1), zone: z.literal('back_center') }),
  patches: z.array(z.object({
    id: z.string().min(1),
    zone: patchZoneEnum,
    scale: z.number().min(0.05).max(1.5),
    rotationDeg: z.number().min(-180).max(180),
  })),
  densityTier: z.enum(['minimal', 'balanced', 'maximal']),
  rationale: z.string().min(1),
  meta: z.object({
    favoriteTeamsRanked: z.array(z.string()),
    vibe: z.string(),
    schemaVersion: z.literal('1.0'),
  }),
});

export function checkInvariants(spec: DesignSpec): string[] {
  const errors: string[] = [];
  if (spec.backGraphic.zone !== 'back_center') errors.push('backGraphic.zone must be back_center');
  if (!backById(spec.backGraphic.id)) errors.push(`backGraphic.id not in catalog: ${spec.backGraphic.id}`);

  const seen = new Set<string>();
  for (const p of spec.patches) {
    if (!placementById(p.id)) errors.push(`patch.id not in catalog: ${p.id}`);
    if (!(PATCH_ZONE_PRIORITY as string[]).includes(p.zone)) errors.push(`invalid patch zone: ${p.zone}`);
    if (seen.has(p.zone)) errors.push(`duplicate patch zone: ${p.zone}`);
    seen.add(p.zone);
    const g = placementById(p.id);
    if (g && !isHarmonious(spec.hoodieColor, g.dominantColors)) {
      errors.push(`low-contrast patch ${p.id} on ${spec.hoodieColor}`);
    }
  }
  const cap = DENSITY_MAX[spec.densityTier];
  if (spec.patches.length > cap) errors.push(`patch count ${spec.patches.length} exceeds cap ${cap}`);
  return errors;
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/schema.test.ts` — Expected: PASS (all 6).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: DesignSpec zod schema + hard-invariant validator"
```

---

### Task 6: Zone assignment

**Files:**
- Create: `lib/engine/zones.ts`, `tests/zones.test.ts`

**Interfaces:**
- Consumes: `PATCH_ZONE_PRIORITY`, `ZONE_DEFAULTS`, `DesignSpec['patches']`.
- Produces: `assignZones(orderedIds: string[], budget: number): DesignSpec['patches']` — maps the first `min(budget, orderedIds.length, 10)` ids onto patch zones in priority order, attaching default scale/rotation. No duplicate zones (one id per zone, in order).

- [ ] **Step 1: Write the failing test** `tests/zones.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assignZones } from '@/lib/engine/zones';
import { PATCH_ZONE_PRIORITY } from '@/lib/catalog/zones';

describe('assignZones', () => {
  it('assigns ids to priority zones up to budget', () => {
    const out = assignZones(['a', 'b', 'c'], 2);
    expect(out).toHaveLength(2);
    expect(out.map(p => p.zone)).toEqual(['front_chest', 'back_upper']);
    expect(out[0]).toMatchObject({ id: 'a', scale: 0.55, rotationDeg: 0 });
  });
  it('never exceeds 10 zones even with a huge budget', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `g${i}`);
    const out = assignZones(ids, 99);
    expect(out).toHaveLength(10);
    expect(new Set(out.map(p => p.zone)).size).toBe(10);
    expect(out.map(p => p.zone)).toEqual(PATCH_ZONE_PRIORITY);
  });
  it('budget 0 yields no patches', () => {
    expect(assignZones(['a'], 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/zones.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/zones.ts`.**

```ts
import type { DesignSpec } from '@/lib/catalog/types';
import { PATCH_ZONE_PRIORITY, ZONE_DEFAULTS } from '@/lib/catalog/zones';

export function assignZones(orderedIds: string[], budget: number): DesignSpec['patches'] {
  const count = Math.max(0, Math.min(budget, orderedIds.length, PATCH_ZONE_PRIORITY.length));
  const patches: DesignSpec['patches'] = [];
  for (let i = 0; i < count; i++) {
    const zone = PATCH_ZONE_PRIORITY[i]!;
    const d = ZONE_DEFAULTS[zone];
    patches.push({ id: orderedIds[i]!, zone, scale: d.scale, rotationDeg: d.rotationDeg });
  }
  return patches;
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/zones.test.ts` — Expected: PASS (all 3).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: deterministic patch-zone assignment"
```

---

### Task 7: Selection logic (back slot, density budget, candidate priority)

**Files:**
- Create: `lib/engine/select.ts`, `tests/select.test.ts`

**Interfaces:**
- Consumes: catalog lookups, `isHarmonious`, `QuestionnaireAnswers`, `Density`.
- Produces:
  - `resolveBack(answers): string` — back graphic id (#1 team's logo, else a deterministic Summer League back graphic).
  - `densityBudget(density): number` — target count (minimal 1, balanced 3, maximal 8).
  - `buildCandidates(answers): string[]` — ordered, de-duplicated, harmony-filtered placement ids: must-have → remaining ranked teams → vegas/summer_league → vibe(mood)-filtered fun.

- [ ] **Step 1: Write the failing test** `tests/select.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveBack, densityBudget, buildCandidates } from '@/lib/engine/select';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const base: QuestionnaireAnswers = { hoodieColor: 'black', teamsRanked: [], density: 'balanced', vibe: 'vegas' };

describe('select', () => {
  it('resolveBack uses #1 team when present', () => {
    expect(resolveBack({ ...base, teamsRanked: ['celtics', 'mavericks'] })).toBe('back_07_celtics');
  });
  it('resolveBack falls back to a Summer League back graphic with no team', () => {
    expect(resolveBack(base)).toBe('back_01_las-vegas-summer-league');
  });
  it('densityBudget maps tiers to targets', () => {
    expect(densityBudget('minimal')).toBe(1);
    expect(densityBudget('balanced')).toBe(3);
    expect(densityBudget('maximal')).toBe(8);
  });
  it('must-have is first; remaining teams follow; deduped; harmony-filtered', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveId: 'plc_40_flamingo',
    });
    expect(out[0]).toBe('plc_40_flamingo');
    expect(out).toContain('plc_66_mavericks');   // remaining team (not the #1 back team)
    expect(out).not.toContain('plc_90_eclipse');  // low-contrast on black → filtered
    expect(new Set(out).size).toBe(out.length);    // deduped
  });
  it('vegas vibe surfaces vegas-mood graphics', () => {
    const out = buildCandidates(base);
    expect(out).toContain('plc_03_welcome-to-las-vegas');
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/select.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/select.ts`.**

```ts
import type { QuestionnaireAnswers, Density, Graphic } from '@/lib/catalog/types';
import {
  BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG,
  teamBackGraphic, teamPatch, placementById,
} from '@/lib/catalog';
import { isHarmonious } from './harmony';

const DENSITY_TARGET: Record<Density, number> = { minimal: 1, balanced: 3, maximal: 8 };
export const densityBudget = (d: Density): number => DENSITY_TARGET[d];

export function resolveBack(answers: QuestionnaireAnswers): string {
  const top = answers.teamsRanked[0];
  if (top) {
    const g = teamBackGraphic(top);
    if (g) return g.id;
  }
  // deterministic Summer League / Vegas fallback: lowest-id SL/vegas back graphic.
  const fallback = BACK_GRAPHIC_CATALOG
    .filter(g => g.category === 'summer_league' || g.category === 'vegas')
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? BACK_GRAPHIC_CATALOG[0]!;
  return fallback.id;
}

export function buildCandidates(answers: QuestionnaireAnswers): string[] {
  const ordered: string[] = [];
  const push = (g?: Graphic) => { if (g && !ordered.includes(g.id)) ordered.push(g.id); };

  // 1. must-have (if valid)
  if (answers.mustHaveId) push(placementById(answers.mustHaveId));
  // 2. remaining ranked teams (skip the #1 team that took the back slot)
  for (const slug of answers.teamsRanked.slice(1)) push(teamPatch(slug));
  // 3. Vegas / Summer League identity, deterministic by id
  PLACEMENT_GRAPHIC_CATALOG
    .filter(g => g.category === 'vegas' || g.category === 'summer_league')
    .sort((a, b) => a.id.localeCompare(b.id)).forEach(push);
  // 4. vibe(mood)-filtered fun graphics, deterministic by id
  PLACEMENT_GRAPHIC_CATALOG
    .filter(g => g.category === 'fun' && g.mood.includes(answers.vibe))
    .sort((a, b) => a.id.localeCompare(b.id)).forEach(push);

  // harmony filter against the chosen fabric
  return ordered.filter(id => {
    const g = placementById(id);
    return g ? isHarmonious(answers.hoodieColor, g.dominantColors) : false;
  });
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/select.test.ts` — Expected: PASS (all 5).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: selection — back slot, density budget, candidate priority"
```

---

### Task 8: Rationale builder

**Files:**
- Create: `lib/engine/rationale.ts`, `tests/rationale.test.ts`

**Interfaces:**
- Consumes: `QuestionnaireAnswers`, catalog lookups.
- Produces: `buildRationale(answers, backId, patchIds): string` — one deterministic fan-facing sentence.

- [ ] **Step 1: Write the failing test** `tests/rationale.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRationale } from '@/lib/engine/rationale';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const a: QuestionnaireAnswers = { hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'vegas' };

describe('buildRationale', () => {
  it('names the back graphic and is deterministic', () => {
    const r1 = buildRationale(a, 'back_07_celtics', ['plc_40_flamingo']);
    const r2 = buildRationale(a, 'back_07_celtics', ['plc_40_flamingo']);
    expect(r1).toBe(r2);
    expect(r1).toMatch(/Boston Celtics/);
    expect(r1.length).toBeGreaterThan(10);
  });
  it('handles the no-team Summer League case', () => {
    const r = buildRationale({ ...a, teamsRanked: [] }, 'back_01_las-vegas-summer-league', []);
    expect(r).toMatch(/Summer League/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/rationale.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/rationale.ts`.**

```ts
import type { QuestionnaireAnswers } from '@/lib/catalog/types';
import { backById, placementById } from '@/lib/catalog';

const VIBE_WORD: Record<QuestionnaireAnswers['vibe'], string> = {
  classic: 'clean and classic', vegas: 'full Vegas energy',
  streetwear: 'bold streetwear', playful: 'playful and fun',
};

export function buildRationale(answers: QuestionnaireAnswers, backId: string, patchIds: string[]): string {
  const back = backById(backId);
  const hero = back?.label ?? 'Summer League';
  const patchLabels = patchIds.map(id => placementById(id)?.label).filter(Boolean) as string[];
  const accents = patchLabels.length
    ? ` accented with ${patchLabels.slice(0, 3).join(', ')}`
    : '';
  return `Your ${hero} front-and-center on a ${answers.hoodieColor} hoodie, ${VIBE_WORD[answers.vibe]}${accents}.`;
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/rationale.test.ts` — Expected: PASS (both).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: deterministic rationale builder"
```

---

### Task 9: Engine orchestrator — always-valid `generate()`

**Files:**
- Create: `lib/engine/generate.ts`, `tests/generate.test.ts`

**Interfaces:**
- Consumes: `resolveBack`, `densityBudget`, `buildCandidates`, `assignZones`, `buildRationale`, `checkInvariants`, `designSpecSchema`.
- Produces: `generate(answers: QuestionnaireAnswers): DesignSpec` — orchestrates selection → zone assignment → rationale, asserts the result passes schema + invariants (throws `EngineError` if not — a bug guard), and is fully deterministic.

- [ ] **Step 1: Write the failing test** `tests/generate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generate } from '@/lib/engine/generate';
import { designSpecSchema, checkInvariants } from '@/lib/engine/schema';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const cases: QuestionnaireAnswers[] = [
  { hoodieColor: 'black', teamsRanked: ['celtics','mavericks'], density: 'maximal', vibe: 'vegas', mustHaveId: 'plc_40_flamingo' },
  { hoodieColor: 'bone',  teamsRanked: [], density: 'minimal', vibe: 'classic' },
  { hoodieColor: 'white', teamsRanked: ['warriors'], density: 'balanced', vibe: 'playful' },
  { hoodieColor: 'grey',  teamsRanked: ['mavericks'], density: 'maximal', vibe: 'streetwear' },
];

describe('generate', () => {
  it('always returns a schema-valid, invariant-clean spec', () => {
    for (const a of cases) {
      const spec = generate(a);
      expect(designSpecSchema.safeParse(spec).success).toBe(true);
      expect(checkInvariants(spec)).toEqual([]);
    }
  });
  it('is deterministic', () => {
    expect(generate(cases[0]!)).toEqual(generate(cases[0]!));
  });
  it('puts #1 team on the back and respects density cap', () => {
    const spec = generate(cases[0]!);
    expect(spec.backGraphic).toEqual({ id: 'back_07_celtics', zone: 'back_center' });
    expect(spec.patches.length).toBeLessThanOrEqual(10);
    expect(new Set(spec.patches.map(p => p.zone)).size).toBe(spec.patches.length);
  });
  it('no-team minimal uses a Summer League back + ≤1 patch', () => {
    const spec = generate(cases[1]!);
    expect(spec.backGraphic.id).toBe('back_01_las-vegas-summer-league');
    expect(spec.patches.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/generate.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/generate.ts`.**

```ts
import type { DesignSpec, QuestionnaireAnswers } from '@/lib/catalog/types';
import { resolveBack, densityBudget, buildCandidates } from './select';
import { assignZones } from './zones';
import { buildRationale } from './rationale';
import { designSpecSchema, checkInvariants } from './schema';

export class EngineError extends Error {}

export function generate(answers: QuestionnaireAnswers): DesignSpec {
  const backId = resolveBack(answers);
  const budget = densityBudget(answers.density);
  const candidates = buildCandidates(answers);
  const patches = assignZones(candidates, budget);

  const spec: DesignSpec = {
    hoodieColor: answers.hoodieColor,
    backGraphic: { id: backId, zone: 'back_center' },
    patches,
    densityTier: answers.density,
    rationale: buildRationale(answers, backId, patches.map(p => p.id)),
    meta: { favoriteTeamsRanked: answers.teamsRanked, vibe: answers.vibe, schemaVersion: '1.0' },
  };

  const parsed = designSpecSchema.safeParse(spec);
  if (!parsed.success) throw new EngineError(`schema: ${parsed.error.message}`);
  const violations = checkInvariants(spec);
  if (violations.length) throw new EngineError(`invariants: ${violations.join('; ')}`);
  return spec;
}
```

- [ ] **Step 4: Run tests to verify pass.** Run: `npm test -- tests/generate.test.ts` — Expected: PASS (all 4).

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat: engine orchestrator with always-valid guarantee"
```

---

### Task 10: `/api/generate` route handler

**Files:**
- Create: `app/api/generate/route.ts`, `lib/engine/answers-schema.ts`, `tests/api-generate.test.ts`

**Interfaces:**
- Consumes: `generate`, catalog (`HoodieColor`/team validation).
- Produces: `answersSchema` (zod for `QuestionnaireAnswers`); `POST(req)` returning `{ spec }` (200) or `{ error }` (400) for bad input.

- [ ] **Step 1: Write the failing test** `tests/api-generate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/generate/route';

function req(body: unknown) {
  return new Request('http://localhost/api/generate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}
describe('POST /api/generate', () => {
  it('returns a valid spec for good input', async () => {
    const res = await POST(req({ hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'vegas' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.spec.backGraphic.id).toBe('back_07_celtics');
  });
  it('rejects malformed input with 400', async () => {
    const res = await POST(req({ hoodieColor: 'purple' }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/api-generate.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/engine/answers-schema.ts`.**

```ts
import { z } from 'zod';
export const answersSchema = z.object({
  hoodieColor: z.enum(['bone', 'black', 'grey', 'white']),
  teamsRanked: z.array(z.string()).default([]),
  density: z.enum(['minimal', 'balanced', 'maximal']),
  vibe: z.enum(['classic', 'vegas', 'streetwear', 'playful']),
  mustHaveId: z.string().optional(),
});
```

- [ ] **Step 4: Implement `app/api/generate/route.ts`.**

```ts
import { NextResponse } from 'next/server';
import { answersSchema } from '@/lib/engine/answers-schema';
import { generate } from '@/lib/engine/generate';

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const parsed = answersSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json({ spec: generate(parsed.data) }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run tests to verify pass.** Run: `npm test -- tests/api-generate.test.ts` — Expected: PASS (both).

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat: /api/generate route with input validation"
```

---

### Task 11: Service seams — persistence + curation (inert)

**Files:**
- Create: `lib/store/design-store.ts`, `lib/curation/curator.ts`, `tests/seams.test.ts`

**Interfaces:**
- Consumes: `DesignSpec`.
- Produces:
  - `DesignStore` interface `{ save(spec): Promise<string>; get(id): Promise<DesignSpec | null> }`; `LocalJsonStore` (in-memory Map for M1, deterministic id via content hash counter).
  - `Curator` interface `{ curate(spec): Promise<DesignSpec> }`; `IdentityCurator` (returns input unchanged). Default export `getCurator()` returns `IdentityCurator` when `ENABLE_LLM_CURATION !== 'true'`.

- [ ] **Step 1: Write the failing test** `tests/seams.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LocalJsonStore } from '@/lib/store/design-store';
import { getCurator } from '@/lib/curation/curator';
import { generate } from '@/lib/engine/generate';

const spec = generate({ hoodieColor: 'black', teamsRanked: ['celtics'], density: 'minimal', vibe: 'vegas' });

describe('seams', () => {
  it('LocalJsonStore round-trips a spec by id', async () => {
    const store = new LocalJsonStore();
    const id = await store.save(spec);
    expect(typeof id).toBe('string');
    expect(await store.get(id)).toEqual(spec);
    expect(await store.get('missing')).toBeNull();
  });
  it('default curator is identity when LLM disabled', async () => {
    delete process.env.ENABLE_LLM_CURATION;
    expect(await getCurator().curate(spec)).toEqual(spec);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- tests/seams.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `lib/store/design-store.ts`.**

```ts
import type { DesignSpec } from '@/lib/catalog/types';
export interface DesignStore {
  save(spec: DesignSpec): Promise<string>;
  get(id: string): Promise<DesignSpec | null>;
}
export class LocalJsonStore implements DesignStore {
  private mem = new Map<string, DesignSpec>();
  private seq = 0;
  async save(spec: DesignSpec): Promise<string> {
    const id = `dsn_${(++this.seq).toString(36).padStart(4, '0')}`;
    this.mem.set(id, spec);
    return id;
  }
  async get(id: string): Promise<DesignSpec | null> {
    return this.mem.get(id) ?? null;
  }
}
```

- [ ] **Step 4: Implement `lib/curation/curator.ts`.**

```ts
import type { DesignSpec } from '@/lib/catalog/types';
export interface Curator { curate(spec: DesignSpec): Promise<DesignSpec>; }
export class IdentityCurator implements Curator {
  async curate(spec: DesignSpec): Promise<DesignSpec> { return spec; }
}
// OpenRouter curator is added in a later milestone, behind ENABLE_LLM_CURATION.
export function getCurator(): Curator { return new IdentityCurator(); }
```

- [ ] **Step 5: Run tests to verify pass.** Run: `npm test -- tests/seams.test.ts` — Expected: PASS (both).

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat: inert persistence + curation seams (local + identity)"
```

---

### Task 12: CLAUDE.md, README, and full green-gate

**Files:**
- Create: `CLAUDE.md`, `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: project docs + a verified all-green state.

- [ ] **Step 1: Create `CLAUDE.md`** capturing: stack; verified brand tokens (`#2845E7` on `#000000`, Poppins + Archivo, wordmark = exact SVG); catalog/zone data model (4 colors; 33 back / 94 placement *target*; PDF-faithful zones, no hood); hard constraints (one back graphic, approved-IDs-only, valid+unique zones, density caps, harmony); commands (`dev`/`build`/`test`/`lint`/`typecheck`); and **patterns to avoid** (no `Math.random`/time in engine; no secrets client-side; never invent catalog items/zones; don't add a hood zone; don't use Inter/Roboto/Arial for display).

- [ ] **Step 2: Create `README.md`** with: project summary; setup (`npm i`, copy `.env.example`); architecture (engine core → API → shell; seed catalog now, PDF pipeline in Plan 2); how to run + test; env vars (all optional in M1); link to the spec and this plan.

- [ ] **Step 3: Run the full gate.**

Run: `npm test` → Expected: all suites pass.
Run: `npm run typecheck` → Expected: no errors.
Run: `npm run lint` → Expected: no errors.
Run: `npm run build` → Expected: Next build succeeds.

- [ ] **Step 4: Commit.**

```bash
git add -A && git commit -m "docs: CLAUDE.md + README for Core Spine foundation"
```

---

## Self-Review (completed against the spec)

- **Spec coverage:** Scaffold + design system (spec §10) → T1–T2. Catalog/zones data model (§4) → T3. Schema + invariants (§5) → T5. Harmony (§6) → T4. Zone assignment + selection + rationale + orchestrator (§6) → T6–T9. API (§11 generate) → T10. Service seams (§12) → T11. Tests (§13) → every engine task is TDD. CLAUDE.md/README + gates (§14, §16) → T12. **Deferred by design (Plans 2–3):** full 127-item catalog + `catalog.json` (§9), 3D hoodie (§8), questionnaire UI (§7) — noted as the next plans.
- **Placeholder scan:** none — every step has real code/commands. The seed catalog is explicitly labeled a subset replaced in Plan 2 (not a placeholder hole).
- **Type consistency:** `Graphic`, `DesignSpec`, `PatchZone`, `QuestionnaireAnswers`, `Density` defined once in `lib/catalog/types.ts` (T3) and imported everywhere; `generate()`, `resolveBack()`, `densityBudget()`, `buildCandidates()`, `assignZones()`, `checkInvariants()`, `designSpecSchema`, `isHarmonious()` signatures match across T4–T11 and their tests.

## Execution Handoff

Plan 1 is the foundation. Plans 2 (Assets & Catalog) and 3 (3D & Questionnaire) follow.
