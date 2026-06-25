# Landing Page — NBA Summer League × LiveX AI ("Design Your Drop")
## Design Spec — "Arena Black / Electric Drop"

**Date:** 2026-06-24
**Route:** `/` (the configurator lives at `/design`; the landing links into it)
**Status:** Approved art direction + choreography + config; ready for implementation plan.

---

## 1. Goal & Bar

A cinematic, scroll-driven landing page whose centerpiece is a 3D basketball-player
model that rotates and transforms as the user scrolls (KMBCH-style centered 3D hero).
First impression for LiveX leadership + the NBA. **Must clear the "doesn't look AI"
bar** (brief §1) — award-tier studio craft, no generic-SaaS / default-font / motionless
output. The bar applies to the **whole product**; this spec establishes the shared
design language (the configurator is a fast-follow re-skin, not bundled here).

### The "not-AI" non-negotiables (enforced)
- **Banned:** Inter/Roboto/Arial/Helvetica/Space-Grotesk display; purple-on-white SaaS
  gradients; centered 3-card feature grids; pill-badge soup; emoji decoration;
  flat/motionless layouts; default browser scroll; stock "headline + 2 buttons" hero.
- **Required:** characterful athletic display type + clean body grotesque; cinematic
  GSAP-eased motion; signature interactions (custom cursor, magnetic elements, SplitText
  kinetic reveals, parallax, marquee, grain, arena glow); a real asset-tied preloader;
  a polished page transition to the configurator; confident dark electric-blue palette.

---

## 2. Locked Decisions

1. **Hero model — use the attached model now, *stylized*.** It is an AI-generated (Tripo)
   Lakers player in a frozen mid-drive pose: generic AI face, fixed pose / no rig, ~44k
   tris, full PBR. Treat with dramatic arena rim-light, partial shadow, dynamic 3/4
   angles, motion framing — lean into the frozen-stride silhouette, downplay the face.
   One-file drop-in path to swap a better/licensed model later.
2. **Logos — placeholder slots now, drop SVGs later.** No LiveX/NBA SL marks exist in
   repo. `<BrandLockup>` ships with a designed placeholder; dropping
   `livex-ai.svg` / `nba-summer-league.svg` into `/public/logos/` makes the real lockup appear.
3. **Display type — condensed athletic sans** (`Anton`; `Bebas Neue` alt). Jersey-number /
   broadcast energy.
4. **Palette — electric-blue lead, gold spark.** LiveX `#2845E7` is the hero accent (blue
   arena rim-light on the model); gold `#F5C24B` used sparingly; deep blacks throughout.

---

## 3. Art Direction — the design language

**Concept.** Las Vegas Summer League, midnight arena. Void-black, a single electric-blue
spotlight raking the player frozen mid-drive, gold sparks like trophy light. Athletic +
editorial; broadcast graphics meet gallery.

### Typography
| Role | Face | Notes |
|---|---|---|
| Display (mega headlines, kinetic) | **Anton** (Google) | ultra-condensed black; tight tracking; `Bebas Neue` alt |
| Body / UI | **Poppins** (existing) | clean grotesque |
| Technical accent (ticker, kickers, indices `(01 — HERO)`, stats) | **JetBrains Mono** | broadcast lower-third feel |

Loaded via `next/font/google`. Huge type scale, tight display tracking, confident
hierarchy, intentional negative space.

### Color & light tokens (extend `app/globals.css @theme`)
| Token | Value | Use |
|---|---|---|
| `--color-void` | `#04050A` (`#000` deep) | base |
| `--color-surface` | `#0B0D14` | panels |
| `--color-brand` | `#2845E7` | **lead accent / arena rim** |
| `--color-brand-glow` | `#4F6BFF` | bloom / light emission |
| `--color-gold` | `#F5C24B` | sparing spark accent |
| `--color-ink` / `--color-ink-muted` | `#F5F7FA` / `#9AA3B2` | text |

### Signature craft layer (the "not-AI" surface)
Arena spotlight rig (blue key + gold rim + deep shadow) + subtle **Bloom**;
**film-grain + vignette** overlay; **mix-blend** glow accents; **SplitText** mask +
char/word kinetic reveals; **magnetic** buttons & nav links; **custom context-aware
cursor** (grows + "drag to rotate" label near the player); **marquee ticker**;
broken-grid editorial layout with oversized section indices; hover micro-interactions on
every interactive element.

---

## 4. Tech Stack (exact)

Next.js 16 App Router + TS + Tailwind v4 (existing), plus:
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei` (installed) + `@react-three/postprocessing` (Bloom).
- **Smooth scroll:** `lenis` via `lenis/react` (`ReactLenis`, `useLenis`), CSS from `lenis/dist/lenis.css`. (NOT `@studio-freight/react-lenis`.)
- **Animation:** `gsap` (3.13+, free incl. ScrollTrigger/SplitText) + `@gsap/react` (`useGSAP`). `gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)`.
- **Optional:** `framer-motion` for component-level motion.

**Critical integration — `SmoothScroll` provider** syncs Lenis to GSAP's ticker
(`gsap.ticker.add` → `lenis.raf(t*1000)`, `lagSmoothing(0)`, `ScrollTrigger.refresh()`,
`autoRaf:false`, `lerp:0.09`). Without it ScrollTrigger jitters.

---

## 5. 3D Hero — model, pipeline, render

**Asset pipeline (proven):**
1. `Blender --background --python` imports the FBX (textures embedded), exports GLB.
2. `@gltf-transform/cli optimize` → Draco geometry + WebP textures (+ simplify if needed).
   Target ≤ ~2.5 MB. Output `/public/models/lebron.glb`.
3. Load with `useGLTF` (Draco). Center/scale with drei `<Center>` / `<Bounds>`.
   (Model is ~2 units tall, Y-up after GLTF export.)

**Canvas placement.** R3F `<Canvas>` as a **fixed full-viewport layer** (`position:fixed;
inset:0; -z`) so the player stays centered while DOM scrolls over/around. `pointer-events`
managed so an **optional drag-to-rotate** never blocks content. Lazy-load Canvas with a
Suspense fallback (the preloader). `dpr={[1,2]}`; pause render when tab hidden.

**Render / lighting.** drei `<Environment>` (studio preset) + strong **blue key + gold rim**
(arena spotlight) + soft `<ContactShadows>` / shadow-casting key; PBR materials; subtle
**Bloom** via `@react-three/postprocessing`. Stylized treatment per Decision 1.

**Preloader.** Branded; progress tied to real loading via drei `useProgress`; resolves
into a choreographed hero reveal (player rises/fades, SplitText headline mask-reveal,
lockup settles).

---

## 6. Scroll Choreography — act system

**Mechanism (brief-recommended).** Fixed Canvas + **one GSAP ScrollTrigger timeline**
scrubs a **proxy object**; values applied in `useFrame` with eased interpolation. 3D +
DOM share the timeline. Rotation runs **0 → 720°** (lands front). Acts are **data-driven**
`{ scrollStart, scrollEnd, rotationY, position:[x,y,z], scale, lightIntensity, lightColor }`.

| Act | Scroll | rotationY | position | scale | light | DOM |
|---|---|---|---|---|---|---|
| Reveal | preload→0 | idle slow | center | 1.0 | blue rising | preloader → hero reveal |
| 1 Hero | 0–.14 | 0→120° | center | 1.0 | blue key + gold rim | SplitText headline, scroll cue, idle spin |
| 2 Video I | .14–.34 | 120→300° | left [-1.6,0,0] | 0.82 | dim, blue back-rim | full-bleed video **right** |
| 3 Feature | .34–.60 | 300→480° | near-ctr [0.4,-0.1,0] | 0.95 | blue key returns | "Answer a few questions…" stats, parallax, CTA |
| 4 Video II | .60–.80 | 480→660° | right [1.6,0,0] | 0.82 | gold spark rim | full-bleed video **left** |
| 5 Outro | .80–1.0 | 660→**720° front** | center scale-up | 1.08 | blue peak + bloom | "Start designing" CTA → transition → `/design`, lockup, footer |

Values are tunable; a **dev-only overlay** reads live scroll progress and edits act values.

---

## 7. Section & Video-Slot Config (drop-in in seconds)

**`landing.config.ts`** — ordered `LANDING_SECTIONS` array; reorder / retheme / toggle a
slot to video **here only**.

```ts
export type SectionKind = "hero" | "video" | "content" | "cta";
export type VideoMode = "play" | "scrub";
export interface LandingSection {
  id: string; kind: SectionKind;
  videoSrc?: string; poster?: string; videoMode?: VideoMode;   // default "play"
  headline?: string; body?: string; theme?: "dark" | "light";
  lebronAct?: { rotationY: number; position: [number, number, number]; scale: number };
}
export const LANDING_SECTIONS: LandingSection[] = [ /* hero, video, content, video, cta */ ];
```

- **`<SectionRenderer>`** maps `kind` → component.
- **`<ScrollVideo>`** — `play` (default: `muted` + `playsInline` + `preload="metadata"`,
  IntersectionObserver/ScrollTrigger play ≥50% in view, optional loop, poster until ready,
  mute affordance if meaningful audio) **and** `scrub` (ScrollTrigger `scrub` ties
  `currentTime` to section progress; document the short-GOP re-encode caveat
  `ffmpeg -g 1 -keyint_min 1` for mobile Safari). **Designed placeholder** (brand gradient
  + animated reel shimmer, or poster) whenever `videoSrc` is missing — never a broken box.
- Conventions: `/public/videos/`, `/public/videos/posters/` (named to match section `id`),
  `/public/models/lebron.glb`, `/public/logos/`.

---

## 8. Component Architecture

```
app/page.tsx                      → landing (SmoothScroll > Preloader > HeroCanvas(fixed) > <main> sections)
app/layout.tsx                    → + Anton + mono fonts

components/landing/
  SmoothScroll.tsx                → Lenis ↔ GSAP ticker provider
  Preloader.tsx                   → useProgress branded loader → reveal trigger
  HeroCanvas.tsx                  → fixed R3F Canvas: model + lighting + postprocessing + drag-rotate
  LebronModel.tsx                 → useGLTF + act application in useFrame
  useLebronActs.ts                → proxy + ScrollTrigger timeline from LANDING_SECTIONS
  SectionRenderer.tsx             → kind → component
  sections/HeroSection.tsx, ContentSection.tsx, CtaSection.tsx
  ScrollVideo.tsx                 → play/scrub + placeholder
  BrandLockup.tsx                 → co-brand lockup + placeholder
  Cursor.tsx                      → custom context-aware cursor
  Magnetic.tsx                    → magnetic wrapper
  Marquee.tsx, GrainOverlay.tsx, SplitReveal.tsx (SplitText helper)
  PageTransition.tsx              → overlay wipe → router.push('/design')
  DevActOverlay.tsx               → dev-only scroll/act tuner

lib/landing/landing.config.ts     → LANDING_SECTIONS + act data
lib/landing/design-tokens.ts      → persisted design-system tokens (type/color/ease/timing) — the shared language (this spec is its narrative)
```

Each unit single-purpose, well-bounded, independently testable.

---

## 9. Performance / Mobile / A11y

- Preloader gates hero reveal on real asset load; lazy Canvas; Suspense; Draco/WebP;
  `dpr={[1,2]}`; pause render on hidden tab; lazy-load below-the-fold media.
- **Mobile tiers:** reduce DPR/lights/postprocessing on mobile; on very constrained
  devices fall back to a **pre-rendered rotating hero** (looping video / image sequence)
  while keeping scroll choreography. Large tap targets; fully usable on phones.
- **`prefers-reduced-motion`:** detect via `matchMedia` inside `useGSAP`; disable scrub /
  auto-rotation / heavy parallax, show posters instead of autoplay, set Lenis `lerp:1`
  (instant) or skip wrapper. Graceful, still-attractive static experience.
- **A11y:** semantic landmarks, keyboard focus + visible rings, `alt` on logos, video
  controls/captions where audio is meaningful, never trap scroll. Watch Lighthouse.

---

## 10. Logos / Page Transition / Deliverables

- **`<BrandLockup>`:** equal visual weight, consistent clear-space, thin vertical divider;
  knockout/white variant on dark, color on light; derive a clean white variant if only
  color supplied (prefer real assets over CSS filters; flag missing variants). `alt` text.
  Placeholder until SVGs dropped in.
- **Page transition** to `/design`: GSAP overlay wipe (or View Transitions API) on the
  primary CTA.
- **Docs:** update `CLAUDE.md` (landing architecture, scroll/3D stack, video drop-in
  workflow) + README ("How to add a video"). Persist the design-system file.

---

## 11. Build Increments (feature branch `feat/landing`)

1. Deps + `SmoothScroll` + design-system file + fonts/tokens.
2. Asset pipeline → optimized `/public/models/lebron.glb`, centered.
3. Fixed HeroCanvas + arena lighting + postprocessing + Preloader.
4. Act engine (config + proxy + ScrollTrigger + `useFrame`) + dev overlay.
5. Sections + SplitText / parallax / marquee / cursor / magnetic / grain.
6. `<ScrollVideo>` + placeholders + `landing.config.ts`.
7. `<BrandLockup>` + placeholder logos.
8. Page transition → `/design`; mobile-tier + reduced-motion fallbacks.
9. Polish · `typecheck`/`lint` · `CLAUDE.md` + README · self-review.

Increments land small on the branch; gate (`typecheck`, `lint`) green per step.

---

## 12. Open / Drop-in Conventions (no blocker)
- Real LiveX / NBA SL SVGs → `/public/logos/` (swap placeholder).
- Better/licensed hero GLB → `/public/models/lebron.glb` (one-file swap).
- Videos → `/public/videos/<id>.mp4` (+ `/public/videos/posters/<id>.jpg`) and one
  `landing.config.ts` line (`videoSrc`, optional `videoMode:"scrub"`).
- Optional licensed display font files / HDRI → swap into the font + Environment config.
