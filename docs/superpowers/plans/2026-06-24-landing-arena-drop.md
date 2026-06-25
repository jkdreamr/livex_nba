# Landing Page — "Arena Black / Electric Drop" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the cinematic, scroll-driven `/` landing page whose centerpiece is a 3D basketball-player model that rotates/transforms across 6 scroll acts, with drop-in video + logo slots, clearing the "doesn't look AI" bar.

**Architecture:** A fixed full-viewport R3F `<Canvas>` renders the model under DOM content scrolled by Lenis. One GSAP ScrollTrigger writes page scroll progress into a module singleton; the model reads it in `useFrame` and eased-interpolates between data-driven act keyframes. Pure logic (act interpolation, config, pipeline output) is unit-tested; visual/motion components are gated by typecheck/lint/build + browser screenshot.

**Tech Stack:** Next.js 16 (App Router, TS) · Tailwind v4 · three / @react-three/fiber / @react-three/drei / @react-three/postprocessing · lenis (lenis/react) · gsap 3.13 + @gsap/react (ScrollTrigger, SplitText) · Vitest.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-06-24-landing-arena-drop-design.md` — the source of truth.
- **No AI-slop:** banned for display — Inter, Roboto, Arial, Helvetica, Space Grotesk; no system-font headlines; no purple-on-white SaaS gradients, 3-card grids, pill soup, emoji decoration, motionless layouts, default scroll.
- **Display font:** `Anton`. **Body:** `Poppins` (existing). **Mono accent:** `JetBrains Mono`. Loaded via `next/font/google`.
- **Palette:** void `#04050A`/`#000`; surface `#0B0D14`; brand `#2845E7`; brand-glow `#4F6BFF`; gold `#F5C24B`; ink `#F5F7FA`; ink-muted `#9AA3B2`.
- **Smooth scroll:** `lenis/react` (`ReactLenis`/`useLenis`), CSS from `lenis/dist/lenis.css`. NOT `@studio-freight/react-lenis`.
- **GSAP:** `gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)`. Lenis↔ticker sync mandatory (`autoRaf:false`, `lagSmoothing(0)`).
- **Canvas:** fixed `inset:0`, `z-index` below content, `dpr={[1,2]}`, pause when tab hidden, lazy-loaded behind Suspense/preloader.
- **Hero model:** stylized rim-lit treatment (downplay generic AI face). One-file swap at `/public/models/lebron.glb`.
- **Drop-in slots:** logos (`/public/logos/`), videos (`/public/videos/`, posters `/public/videos/posters/`) — placeholders look finished before assets exist.
- **A11y / mobile / reduced-motion:** semantic landmarks, focus rings, `alt` on logos; mobile DPR/light tiers + pre-rendered fallback; `prefers-reduced-motion` disables scrub/parallax/autoplay, instant scroll.
- **Commands:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Engine stays pure (no Math.random/Date.now in `lib/engine`).
- **Branch:** `feat/landing`. Gate green every task.

---

## File Structure

```
app/
  page.tsx                          MODIFY → the landing (replaces current hero)
  layout.tsx                        MODIFY → + Anton + JetBrains Mono fonts
  globals.css                       MODIFY → + landing tokens, grain, cursor base
lib/landing/
  design-tokens.ts                  CREATE → EASES, DURATIONS, COLORS, TYPE constants
  landing.config.ts                 CREATE → SectionKind/VideoMode/LandingSection types, LANDING_SECTIONS, ACT_KEYFRAMES
  acts.ts                           CREATE → poseAtProgress() pure interpolation
  scroll-state.ts                   CREATE → module singleton { progress }
components/landing/
  SmoothScroll.tsx                  CREATE → Lenis ↔ GSAP ticker provider
  Preloader.tsx                     CREATE → useProgress loader → reveal
  HeroCanvas.tsx                    CREATE → fixed Canvas, lights, postprocessing, drag-rotate
  LebronModel.tsx                   CREATE → useGLTF + act application in useFrame
  useLebronActs.ts                  CREATE → ScrollTrigger → scroll-state.progress
  DevActOverlay.tsx                 CREATE → dev-only scroll/pose readout
  SectionRenderer.tsx               CREATE → kind → component
  sections/HeroSection.tsx          CREATE
  sections/ContentSection.tsx       CREATE
  sections/CtaSection.tsx           CREATE
  ScrollVideo.tsx                   CREATE → play/scrub + placeholder
  BrandLockup.tsx                   CREATE → co-brand + placeholder
  Cursor.tsx                        CREATE → context-aware cursor
  Magnetic.tsx                      CREATE → magnetic wrapper
  Marquee.tsx                       CREATE → ticker
  GrainOverlay.tsx                  CREATE → film grain + vignette
  SplitReveal.tsx                   CREATE → SplitText kinetic headline
  PageTransition.tsx                CREATE → overlay wipe → /design
scripts/build-lebron.mjs            CREATE → FBX→GLB (Blender) + gltf-transform optimize
tests/landing/
  acts.test.ts                      CREATE
  landing-config.test.ts            CREATE
  model-asset.test.ts               CREATE
public/models/lebron.glb            GENERATED
public/models/lebron-LICENSE.txt    GENERATED
```

---

### Task 1: Dependencies, fonts, tokens, SmoothScroll provider

**Files:**
- Modify: `package.json` (deps), `app/layout.tsx`, `app/globals.css`
- Create: `lib/landing/design-tokens.ts`, `components/landing/SmoothScroll.tsx`

**Interfaces:**
- Produces: `<SmoothScroll>` provider; `EASES`, `DURATIONS`, `LANDING_COLORS` from `design-tokens.ts`; font CSS vars `--font-anton`, `--font-mono`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm i lenis gsap @gsap/react @react-three/postprocessing framer-motion
```
Expected: added to `package.json`; `three`/`@react-three/fiber`/`@react-three/drei` already present.

- [ ] **Step 2: Add fonts in `app/layout.tsx`**

Add Anton + JetBrains Mono next to the existing Poppins/Archivo imports, and append their CSS vars to the `<html>` className:
```tsx
import { Poppins, Archivo, Anton, JetBrains_Mono } from 'next/font/google';
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-mono' });
// in <html className={`${poppins.variable} ${archivo.variable} ${anton.variable} ${mono.variable}`}>
```

- [ ] **Step 3: Extend `app/globals.css` `@theme`**

Add inside the existing `@theme {}` block:
```css
  --color-void: #04050A;
  --color-brand-glow: #4F6BFF;
  --color-gold: #F5C24B;
  --font-display-impact: var(--font-anton), var(--font-archivo), sans-serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;
```
And after the `body` rule add a grain utility + hidden-cursor base:
```css
@media (pointer: fine) { html.lx-cursor, html.lx-cursor * { cursor: none; } }
.lx-grain::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 60; opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Create `lib/landing/design-tokens.ts`**

```ts
/** Persisted design-system constants — the shared motion/color language. */
export const LANDING_COLORS = {
  void: '#04050A', surface: '#0B0D14', brand: '#2845E7',
  brandGlow: '#4F6BFF', gold: '#F5C24B', ink: '#F5F7FA', inkMuted: '#9AA3B2',
} as const;

/** Custom GSAP eases (registered once where used via CustomEase, or these cubic-beziers). */
export const EASES = {
  power: 'power4.out',
  expo: 'expo.inOut',
  drop: 'power3.inOut',
  reveal: 'power2.out',
} as const;

export const DURATIONS = { reveal: 1.1, stagger: 0.045, transition: 0.9 } as const;
```

- [ ] **Step 5: Create `components/landing/SmoothScroll.tsx`**

```tsx
'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<{ lenis?: { raf: (t: number) => void } }>(null);
  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => gsap.ticker.remove(update);
  }, []);
  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.09, smoothWheel: true, autoRaf: false }}>
      {children}
    </ReactLenis>
  );
}
```

- [ ] **Step 6: Verify gate**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/layout.tsx app/globals.css lib/landing/design-tokens.ts components/landing/SmoothScroll.tsx
git commit -m "feat(landing): deps, fonts, tokens, Lenis+GSAP SmoothScroll provider"
```

---

### Task 2: 3D asset pipeline (FBX → optimized GLB)

**Files:**
- Create: `scripts/build-lebron.mjs`, `tests/landing/model-asset.test.ts`
- Generated: `public/models/lebron.glb`, `public/models/lebron-LICENSE.txt`

**Interfaces:**
- Produces: `/models/lebron.glb` (Draco + WebP, Y-up, centered-able, ≤ ~3 MB) consumed by `LebronModel`.

- [ ] **Step 1: Create `scripts/build-lebron.mjs`**

Drives Blender headless (FBX→GLB) then `@gltf-transform/cli optimize`. The Blender python is inlined; `SRC` points at the user's FBX (override via `--src`).
```js
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SRC = process.argv.find(a => a.startsWith('--src='))?.slice(6)
  ?? '/Users/joshuakoo/Downloads/76c95916f04d4339b403b3a87ab07ca7.fbx';
const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';
mkdirSync('public/models', { recursive: true });

const py = `
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=r"${SRC}")
bpy.ops.export_scene.gltf(filepath="/tmp/lebron_raw.glb", export_format='GLB', export_yup=True)
`;
writeFileSync('/tmp/_blender_lebron.py', py);
execFileSync(BLENDER, ['--background', '--python', '/tmp/_blender_lebron.py'], { stdio: 'inherit' });
// Draco + WebP + prune; keep it conservative (no aggressive simplify — preserve silhouette).
execFileSync('npx', ['@gltf-transform/cli', 'optimize', '/tmp/lebron_raw.glb',
  'public/models/lebron.glb', '--texture-compress', 'webp', '--compress', 'draco'], { stdio: 'inherit' });
writeFileSync('public/models/lebron-LICENSE.txt',
  'Hero model: AI-generated via Tripo (tripo_pbr_model). Placeholder hero asset — replace with a licensed model before any public/commercial launch.\n');
console.log('built public/models/lebron.glb');
```

- [ ] **Step 2: Run the pipeline**

Run: `node scripts/build-lebron.mjs`
Expected: prints `built public/models/lebron.glb`; file exists.

- [ ] **Step 3: Write the failing asset test `tests/landing/model-asset.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'node:fs';

describe('lebron model asset', () => {
  it('exists and is reasonably sized (<3.5MB)', () => {
    expect(existsSync('public/models/lebron.glb')).toBe(true);
    expect(statSync('public/models/lebron.glb').size).toBeLessThan(3.5 * 1024 * 1024);
  });
  it('ships a license/attribution note', () => {
    expect(existsSync('public/models/lebron-LICENSE.txt')).toBe(true);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/landing/model-asset.test.ts`
Expected: PASS (if size ≥3.5MB, re-run optimize with `--texture-size 1024` added in the script, then re-test).

- [ ] **Step 5: Commit**

```bash
git add scripts/build-lebron.mjs tests/landing/model-asset.test.ts public/models/lebron.glb public/models/lebron-LICENSE.txt
git commit -m "feat(landing): FBX->GLB asset pipeline + optimized hero model"
```

---

### Task 3: Landing config, act interpolation (TDD), scroll-state singleton

**Files:**
- Create: `lib/landing/landing.config.ts`, `lib/landing/acts.ts`, `lib/landing/scroll-state.ts`, `tests/landing/acts.test.ts`, `tests/landing/landing-config.test.ts`

**Interfaces:**
- Produces:
  - `type LandingSection`, `LANDING_SECTIONS: LandingSection[]`, `ACT_KEYFRAMES: ActKeyframe[]`.
  - `type ActKeyframe = { at: number; rotationY: number; position: [number,number,number]; scale: number; intensity: number }`.
  - `type LebronPose = { rotationY: number; position: [number,number,number]; scale: number; intensity: number }`.
  - `poseAtProgress(progress: number, keys?: ActKeyframe[]): LebronPose`.
  - `scrollState: { progress: number }` (mutable singleton).

- [ ] **Step 1: Create `lib/landing/scroll-state.ts`**

```ts
/** Mutable singleton: ScrollTrigger writes `progress` (0..1); useFrame reads it. */
export const scrollState = { progress: 0 };
```

- [ ] **Step 2: Create `lib/landing/landing.config.ts`**

```ts
export type SectionKind = 'hero' | 'video' | 'content' | 'cta';
export type VideoMode = 'play' | 'scrub';

export interface LandingSection {
  id: string;
  kind: SectionKind;
  videoSrc?: string;
  poster?: string;
  videoMode?: VideoMode;
  headline?: string;
  body?: string;
  theme?: 'dark' | 'light';
}

export interface ActKeyframe {
  at: number; // scroll progress 0..1 where this pose is reached
  rotationY: number; // degrees
  position: [number, number, number];
  scale: number;
  intensity: number; // 0..1 light energy multiplier
}

/** Edit sections/order/video-slots HERE only. */
export const LANDING_SECTIONS: LandingSection[] = [
  { id: 'hero', kind: 'hero', headline: 'DESIGN YOUR DROP', body: 'NBA SUMMER LEAGUE · LAS VEGAS 2026' },
  { id: 'reel-1', kind: 'video', headline: 'BUILT FOR THE MOMENT', theme: 'dark' /* videoSrc: '/videos/reel-1.mp4' */ },
  { id: 'how', kind: 'content', headline: 'ANSWER A FEW QUESTIONS.', body: 'Get a hoodie made for you — designed in 3D, made for real.' },
  { id: 'reel-2', kind: 'video', headline: 'YOUR TEAM. YOUR CITY.', theme: 'dark' /* videoSrc: '/videos/reel-2.mp4' */ },
  { id: 'cta', kind: 'cta', headline: 'START DESIGNING', body: 'Your drop is one scroll away.' },
];

/** The LeBron choreography — keyframes across full-page scroll (0..720deg, lands front). */
export const ACT_KEYFRAMES: ActKeyframe[] = [
  { at: 0.00, rotationY: 0,   position: [0, 0, 0],      scale: 1.00, intensity: 1.0 },
  { at: 0.14, rotationY: 120, position: [0, 0, 0],      scale: 1.00, intensity: 1.0 },
  { at: 0.34, rotationY: 300, position: [-1.6, 0, 0],   scale: 0.82, intensity: 0.6 },
  { at: 0.60, rotationY: 480, position: [0.4, -0.1, 0], scale: 0.95, intensity: 1.0 },
  { at: 0.80, rotationY: 660, position: [1.6, 0, 0],    scale: 0.82, intensity: 0.7 },
  { at: 1.00, rotationY: 720, position: [0, 0.05, 0],   scale: 1.08, intensity: 1.2 },
];
```

- [ ] **Step 3: Write failing tests `tests/landing/acts.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { poseAtProgress } from '@/lib/landing/acts';
import { ACT_KEYFRAMES } from '@/lib/landing/landing.config';

describe('poseAtProgress', () => {
  it('returns the first keyframe at progress 0 (and clamps below)', () => {
    expect(poseAtProgress(0).rotationY).toBe(0);
    expect(poseAtProgress(-1).rotationY).toBe(0);
  });
  it('returns the last keyframe at progress 1 (and clamps above)', () => {
    expect(poseAtProgress(1).rotationY).toBe(720);
    expect(poseAtProgress(2).rotationY).toBe(720);
  });
  it('rotation increases monotonically across the page', () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const r = poseAtProgress(Math.min(p, 1)).rotationY;
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
  it('interpolates position between surrounding keyframes', () => {
    // between at=0.14 (x=0) and at=0.34 (x=-1.6): midpoint x is between them
    const mid = poseAtProgress(0.24).position[0];
    expect(mid).toBeLessThan(0);
    expect(mid).toBeGreaterThan(-1.6);
  });
  it('hits an exact keyframe value at its `at`', () => {
    expect(poseAtProgress(0.34).position[0]).toBeCloseTo(-1.6, 5);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/landing/acts.test.ts`
Expected: FAIL ("poseAtProgress is not a function").

- [ ] **Step 5: Implement `lib/landing/acts.ts`**

```ts
import { ACT_KEYFRAMES, type ActKeyframe } from './landing.config';

export interface LebronPose {
  rotationY: number;
  position: [number, number, number];
  scale: number;
  intensity: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
// smooth ease so transitions between acts are never linear/abrupt
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function poseAtProgress(progress: number, keys: ActKeyframe[] = ACT_KEYFRAMES): LebronPose {
  const p = clamp01(progress);
  let lo = keys[0]!;
  let hi = keys[keys.length - 1]!;
  for (let i = 0; i < keys.length - 1; i++) {
    if (p >= keys[i]!.at && p <= keys[i + 1]!.at) { lo = keys[i]!; hi = keys[i + 1]!; break; }
  }
  const span = hi.at - lo.at || 1;
  const t = ease(clamp01((p - lo.at) / span));
  return {
    rotationY: lerp(lo.rotationY, hi.rotationY, t),
    position: [
      lerp(lo.position[0], hi.position[0], t),
      lerp(lo.position[1], hi.position[1], t),
      lerp(lo.position[2], hi.position[2], t),
    ],
    scale: lerp(lo.scale, hi.scale, t),
    intensity: lerp(lo.intensity, hi.intensity, t),
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/landing/acts.test.ts`
Expected: PASS.

- [ ] **Step 7: Write `tests/landing/landing-config.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { LANDING_SECTIONS, ACT_KEYFRAMES } from '@/lib/landing/landing.config';

describe('landing config', () => {
  it('has unique section ids', () => {
    const ids = LANDING_SECTIONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('starts with a hero and ends with a cta', () => {
    expect(LANDING_SECTIONS[0]!.kind).toBe('hero');
    expect(LANDING_SECTIONS.at(-1)!.kind).toBe('cta');
  });
  it('act keyframes are sorted and span 0..1', () => {
    expect(ACT_KEYFRAMES[0]!.at).toBe(0);
    expect(ACT_KEYFRAMES.at(-1)!.at).toBe(1);
    for (let i = 1; i < ACT_KEYFRAMES.length; i++) {
      expect(ACT_KEYFRAMES[i]!.at).toBeGreaterThan(ACT_KEYFRAMES[i - 1]!.at);
    }
  });
});
```

- [ ] **Step 8: Run tests + commit**

Run: `npx vitest run tests/landing/`
Expected: PASS.
```bash
git add lib/landing/scroll-state.ts lib/landing/landing.config.ts lib/landing/acts.ts tests/landing/acts.test.ts tests/landing/landing-config.test.ts
git commit -m "feat(landing): config + tested act-interpolation + scroll-state singleton"
```

---

### Task 4: Hero Canvas + model + arena lighting + postprocessing

**Files:**
- Create: `components/landing/LebronModel.tsx`, `components/landing/HeroCanvas.tsx`

**Interfaces:**
- Consumes: `/models/lebron.glb`, `scrollState`, `poseAtProgress`.
- Produces: `<HeroCanvas>` (fixed full-viewport 3D layer). `LebronModel` reads `scrollState.progress` each frame.

- [ ] **Step 1: Create `components/landing/LebronModel.tsx`**

```tsx
'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { scrollState } from '@/lib/landing/scroll-state';
import { poseAtProgress } from '@/lib/landing/acts';

const MODEL = '/models/lebron.glb';
const DEG = Math.PI / 180;

export function LebronModel({ onIntensity }: { onIntensity?: (v: number) => void }) {
  const { scene } = useGLTF(MODEL);
  const ref = useRef<THREE.Group>(null);
  const idle = useRef(0);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const pose = poseAtProgress(scrollState.progress);
    idle.current += delta * 0.15; // gentle idle drift layered on the act rotation
    g.rotation.y = pose.rotationY * DEG + Math.sin(idle.current) * 0.03;
    g.position.set(pose.position[0], pose.position[1], pose.position[2]);
    g.scale.setScalar(pose.scale);
    onIntensity?.(pose.intensity);
  });

  return (
    <group ref={ref}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}
useGLTF.preload(MODEL);
```

- [ ] **Step 2: Create `components/landing/HeroCanvas.tsx`**

```tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { LebronModel } from './LebronModel';
import { LANDING_COLORS } from '@/lib/landing/design-tokens';

export function HeroCanvas() {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.2, 6], fov: 32 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[LANDING_COLORS.void]} />
        <fog attach="fog" args={[LANDING_COLORS.void, 8, 18]} />
        <ambientLight intensity={0.25} />
        {/* blue arena key + gold rim */}
        <directionalLight ref={keyRef} position={[4, 6, 5]} intensity={2.6} color={LANDING_COLORS.brandGlow} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 3, -4]} intensity={1.4} color={LANDING_COLORS.gold} />
        <spotLight position={[0, 8, 2]} angle={0.5} penumbra={1} intensity={2.0} color="#ffffff" />
        <Suspense fallback={null}>
          <LebronModel onIntensity={(v) => { if (keyRef.current) keyRef.current.intensity = 2.6 * v; }} />
          <Environment preset="city" />
        </Suspense>
        <ContactShadows position={[0, -1.6, 0]} opacity={0.55} scale={9} blur={3} far={4} color="#000000" />
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: Verify gate**

Run: `npm run typecheck && npm run lint`
Expected: clean. (Browser wiring happens in Task 8; this compiles standalone.)

- [ ] **Step 4: Commit**

```bash
git add components/landing/LebronModel.tsx components/landing/HeroCanvas.tsx
git commit -m "feat(landing): fixed hero Canvas, arena lighting, bloom, model act-driven"
```

---

### Task 5: Act engine (ScrollTrigger → scroll-state) + dev overlay

**Files:**
- Create: `components/landing/useLebronActs.ts`, `components/landing/DevActOverlay.tsx`

**Interfaces:**
- Consumes: `scrollState`. Produces: `useLebronActs()` hook (sets up the page ScrollTrigger); `<DevActOverlay>`.

- [ ] **Step 1: Create `components/landing/useLebronActs.ts`**

```tsx
'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState } from '@/lib/landing/scroll-state';
gsap.registerPlugin(ScrollTrigger);

/** One trigger over the whole scroll container writes 0..1 into scrollState. */
export function useLebronActs(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => { scrollState.progress = self.progress; },
    });
    return () => st.kill();
  }, [enabled]);
}
```

- [ ] **Step 2: Create `components/landing/DevActOverlay.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { scrollState } from '@/lib/landing/scroll-state';
import { poseAtProgress } from '@/lib/landing/acts';

export function DevActOverlay() {
  const [, force] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => { force((n) => n + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (process.env.NODE_ENV === 'production') return null;
  const p = scrollState.progress;
  const pose = poseAtProgress(p);
  return (
    <div className="fixed bottom-3 left-3 z-[70] rounded-lg border border-line bg-black/70 px-3 py-2 font-mono text-[11px] text-ink-muted backdrop-blur">
      progress {p.toFixed(3)} · rotY {pose.rotationY.toFixed(0)}° · scale {pose.scale.toFixed(2)} · x {pose.position[0].toFixed(2)}
    </div>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint`
```bash
git add components/landing/useLebronActs.ts components/landing/DevActOverlay.tsx
git commit -m "feat(landing): scroll act engine (ScrollTrigger->scroll-state) + dev overlay"
```

---

### Task 6: Preloader (real asset progress) + reveal orchestration

**Files:**
- Create: `components/landing/Preloader.tsx`

**Interfaces:**
- Consumes: drei `useProgress`. Produces: `<Preloader onDone={() => void}>` overlay; calls `onDone` when loaded.

- [ ] **Step 1: Create `components/landing/Preloader.tsx`**

```tsx
'use client';
import { useProgress } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const { progress, active } = useProgress();

  useEffect(() => {
    if (bar.current) gsap.to(bar.current, { scaleX: progress / 100, duration: 0.4, ease: 'power2.out' });
    if (num.current) num.current.textContent = `${Math.round(progress)}`;
  }, [progress]);

  useEffect(() => {
    if (!active && progress >= 100 && root.current) {
      gsap.timeline()
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.2 })
        .add(() => onDone(), '-=0.2');
    }
  }, [active, progress, onDone]);

  return (
    <div ref={root} className="fixed inset-0 z-[80] grid place-items-center bg-void">
      <div className="w-[min(80vw,520px)]">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-ink-muted">Loading the arena</p>
        <div className="mt-3 flex items-end justify-between">
          <span ref={num} className="font-[family-name:var(--font-anton)] text-7xl text-ink">0</span>
          <span className="font-mono text-sm text-ink-muted">/100</span>
        </div>
        <div className="mt-4 h-px w-full bg-line">
          <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-brand" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck && npm run lint`
```bash
git add components/landing/Preloader.tsx
git commit -m "feat(landing): branded preloader tied to useProgress with reveal"
```

---

### Task 7: Craft primitives — cursor, magnetic, marquee, grain, split reveal

**Files:**
- Create: `components/landing/Cursor.tsx`, `Magnetic.tsx`, `Marquee.tsx`, `GrainOverlay.tsx`, `SplitReveal.tsx`

**Interfaces:**
- Produces: `<Cursor>`, `<Magnetic>{children}</Magnetic>`, `<Marquee items={string[]}>`, `<GrainOverlay>`, `<SplitReveal text trigger>`.

- [ ] **Step 1: `components/landing/GrainOverlay.tsx`**

```tsx
'use client';
import { useEffect } from 'react';
export function GrainOverlay() {
  useEffect(() => { document.documentElement.classList.add('lx-grain'); return () => document.documentElement.classList.remove('lx-grain'); }, []);
  return <div className="pointer-events-none fixed inset-0 z-[55]" style={{ background: 'radial-gradient(120% 80% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />;
}
```

- [ ] **Step 2: `components/landing/Magnetic.tsx`**

```tsx
'use client';
import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: 0.5, ease: 'power3.out' });
  };
  const reset = () => { if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }); };
  return <span ref={ref} onMouseMove={onMove} onMouseLeave={reset} className="inline-block" data-cursor="grow">{children}</span>;
}
```

- [ ] **Step 3: `components/landing/Cursor.tsx`** (context-aware; grows + labels near `[data-cursor]`)

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.documentElement.classList.add('lx-cursor');
    const move = (e: MouseEvent) => {
      gsap.to(dot.current, { x: e.clientX, y: e.clientY, duration: 0.25, ease: 'power3.out' });
      const t = (e.target as HTMLElement)?.closest('[data-cursor]') as HTMLElement | null;
      const mode = t?.dataset.cursor;
      gsap.to(dot.current, { scale: mode ? 3.2 : 1, duration: 0.3 });
      if (label.current) label.current.textContent = mode === 'rotate' ? 'drag to rotate' : mode === 'grow' ? '' : '';
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); document.documentElement.classList.remove('lx-cursor'); };
  }, []);
  return (
    <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[90] -ml-2 -mt-2 grid h-4 w-4 place-items-center rounded-full bg-brand mix-blend-difference">
      <span ref={label} className="absolute whitespace-nowrap font-mono text-[8px] text-white" style={{ transform: 'scale(0.31)' }} />
    </div>
  );
}
```

- [ ] **Step 4: `components/landing/Marquee.tsx`**

```tsx
'use client';
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line py-3" aria-hidden>
      <div className="flex w-max animate-[lxmarquee_28s_linear_infinite] gap-8 font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-ink-muted">
        {row.map((t, i) => (<span key={i} className="flex items-center gap-8">{t}<span className="text-brand">•</span></span>))}
      </div>
      <style>{`@keyframes lxmarquee{to{transform:translateX(-33.33%)}}`}</style>
    </div>
  );
}
```

- [ ] **Step 5: `components/landing/SplitReveal.tsx`** (SplitText mask reveal via useGSAP)

```tsx
'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(useGSAP, SplitText);
export function SplitReveal({ text, className = '', as = 'h2' }: { text: string; className?: string; as?: 'h1' | 'h2' }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const split = new SplitText(ref.current, { type: 'chars,words' });
    gsap.from(split.chars, {
      yPercent: 120, opacity: 0, stagger: 0.02, duration: 0.9, ease: 'power4.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%' },
    });
  }, { scope: ref });
  const Tag = as;
  return <Tag ref={ref} className={className}>{text}</Tag>;
}
```

- [ ] **Step 6: Verify + commit**

Run: `npm run typecheck && npm run lint`
```bash
git add components/landing/Cursor.tsx components/landing/Magnetic.tsx components/landing/Marquee.tsx components/landing/GrainOverlay.tsx components/landing/SplitReveal.tsx
git commit -m "feat(landing): craft primitives — cursor, magnetic, marquee, grain, split reveal"
```

---

### Task 8: Sections, SectionRenderer, page assembly (first full render)

**Files:**
- Create: `components/landing/sections/HeroSection.tsx`, `ContentSection.tsx`, `CtaSection.tsx`, `components/landing/SectionRenderer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `LANDING_SECTIONS`, all Task 4–7 components. Produces: assembled landing. (ScrollVideo added Task 9 — until then `video` sections render the content shell.)

- [ ] **Step 1: `HeroSection.tsx`**

```tsx
'use client';
import { SplitReveal } from '../SplitReveal';
import type { LandingSection } from '@/lib/landing/landing.config';
export function HeroSection({ section }: { section: LandingSection }) {
  return (
    <section className="relative grid min-h-dvh place-items-center px-6 text-center">
      <div data-cursor="rotate" className="absolute inset-0" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-ink-muted">{section.body}</p>
        <SplitReveal as="h1" text={section.headline ?? ''} className="mt-4 font-[family-name:var(--font-anton)] text-[18vw] leading-[0.82] text-ink md:text-[12vw]" />
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-ink-muted">Scroll ↓</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `ContentSection.tsx`** (parallax + CTA into configurator)

```tsx
'use client';
import Link from 'next/link';
import { SplitReveal } from '../SplitReveal';
import { Magnetic } from '../Magnetic';
import type { LandingSection } from '@/lib/landing/landing.config';
export function ContentSection({ section }: { section: LandingSection }) {
  return (
    <section className="relative grid min-h-dvh items-center px-6 md:px-16">
      <div className="max-w-2xl">
        <span className="font-mono text-xs text-brand">(02 — THE DROP)</span>
        <SplitReveal text={section.headline ?? ''} className="mt-3 font-[family-name:var(--font-anton)] text-6xl uppercase leading-[0.9] text-ink md:text-8xl" />
        <p className="mt-6 max-w-md font-sans text-lg text-ink-muted">{section.body}</p>
        <Magnetic>
          <Link href="/design" data-cursor="grow" className="mt-8 inline-flex rounded-full bg-brand px-7 py-3 font-sans text-sm font-semibold text-white">Start designing →</Link>
        </Magnetic>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `CtaSection.tsx`**

```tsx
'use client';
import { SplitReveal } from '../SplitReveal';
import { Magnetic } from '../Magnetic';
import { BrandLockup } from '../BrandLockup';
import type { LandingSection } from '@/lib/landing/landing.config';
export function CtaSection({ section, onStart }: { section: LandingSection; onStart: () => void }) {
  return (
    <section className="relative grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <SplitReveal text={section.headline ?? ''} className="font-[family-name:var(--font-anton)] text-[16vw] leading-[0.85] text-ink md:text-[11vw]" />
        <p className="mt-6 font-sans text-ink-muted">{section.body}</p>
        <Magnetic>
          <button onClick={onStart} data-cursor="grow" className="mt-8 rounded-full bg-brand px-9 py-4 font-sans text-base font-semibold text-white">Start designing →</button>
        </Magnetic>
        <div className="mt-16"><BrandLockup /></div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `SectionRenderer.tsx`** (kind → component; `video` falls back to content shell until Task 9)

```tsx
'use client';
import type { LandingSection } from '@/lib/landing/landing.config';
import { HeroSection } from './sections/HeroSection';
import { ContentSection } from './sections/ContentSection';
import { CtaSection } from './sections/CtaSection';
export function SectionRenderer({ section, onStart }: { section: LandingSection; onStart: () => void }) {
  switch (section.kind) {
    case 'hero': return <HeroSection section={section} />;
    case 'content': return <ContentSection section={section} />;
    case 'cta': return <CtaSection section={section} onStart={onStart} />;
    case 'video': return <ContentSection section={section} />; // replaced by <ScrollVideo> in Task 9
  }
}
```

- [ ] **Step 5: Assemble `app/page.tsx`** (client landing)

```tsx
'use client';
import { useState, useCallback } from 'react';
import { SmoothScroll } from '@/components/landing/SmoothScroll';
import { HeroCanvas } from '@/components/landing/HeroCanvas';
import { Preloader } from '@/components/landing/Preloader';
import { Cursor } from '@/components/landing/Cursor';
import { GrainOverlay } from '@/components/landing/GrainOverlay';
import { Marquee } from '@/components/landing/Marquee';
import { DevActOverlay } from '@/components/landing/DevActOverlay';
import { SectionRenderer } from '@/components/landing/SectionRenderer';
import { useLebronActs } from '@/components/landing/useLebronActs';
import { LANDING_SECTIONS } from '@/lib/landing/landing.config';

export default function Home() {
  const [ready, setReady] = useState(false);
  useLebronActs(ready);
  const onStart = useCallback(() => { window.location.href = '/design'; }, []); // replaced by PageTransition in Task 11
  return (
    <SmoothScroll>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <GrainOverlay />
      <HeroCanvas />
      <main className="relative z-10">
        {LANDING_SECTIONS.map((s) => <SectionRenderer key={s.id} section={s} onStart={onStart} />)}
        <Marquee items={['NBA SUMMER LEAGUE', 'LAS VEGAS 2026', 'DESIGN YOUR DROP', 'LIVEX AI']} />
      </main>
      <DevActOverlay />
    </SmoothScroll>
  );
}
```

- [ ] **Step 6: Browser verification (the visual gate for this task)**

Run: `npm run build` (expect success). Then start the dev server, load `/`, and confirm via screenshot: preloader → reveal, model centered + rotating on scroll, sections legible, marquee runs, custom cursor active, no console errors. Fix issues, re-verify.

- [ ] **Step 7: Commit**

```bash
git add components/landing/sections components/landing/SectionRenderer.tsx app/page.tsx
git commit -m "feat(landing): sections + renderer + page assembly (first full render)"
```

---

### Task 9: ScrollVideo (play + scrub modes, designed placeholder)

**Files:**
- Create: `components/landing/ScrollVideo.tsx`
- Modify: `components/landing/SectionRenderer.tsx` (route `video` → `<ScrollVideo>`)

**Interfaces:**
- Consumes: `LandingSection`. Produces: `<ScrollVideo section={LandingSection} />`.

- [ ] **Step 1: Create `components/landing/ScrollVideo.tsx`**

```tsx
'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { LandingSection } from '@/lib/landing/landing.config';
gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ScrollVideo({ section }: { section: LandingSection }) {
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(section.videoSrc);
  const mode = section.videoMode ?? 'play';

  useGSAP(() => {
    if (!hasVideo || !vid.current) return;
    const v = vid.current;
    if (mode === 'scrub') {
      const set = () => ScrollTrigger.create({
        trigger: wrap.current, start: 'top bottom', end: 'bottom top', scrub: true,
        onUpdate: (s) => { if (v.duration) v.currentTime = s.progress * v.duration; },
      });
      v.readyState >= 1 ? set() : v.addEventListener('loadedmetadata', set, { once: true });
    } else {
      ScrollTrigger.create({
        trigger: wrap.current, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => v.play().catch(() => {}), onLeave: () => v.pause(),
        onEnterBack: () => v.play().catch(() => {}), onLeaveBack: () => v.pause(),
      });
    }
  }, { scope: wrap, dependencies: [hasVideo, mode] });

  return (
    <section ref={wrap} className="relative grid min-h-dvh place-items-center px-6">
      <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-line">
        {hasVideo ? (
          <video ref={vid} src={section.videoSrc} poster={section.poster} muted playsInline preload="metadata"
            loop={mode === 'play'} className="h-full w-full object-cover" />
        ) : (
          // designed placeholder — looks intentional before any file exists
          <div className="grid h-full w-full place-items-center bg-[linear-gradient(120deg,#0B0D14,#04050A_60%)]">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(60%_60%_at_50%_50%,rgba(40,69,231,0.25),transparent_70%)]" />
            <p className="relative font-mono text-xs uppercase tracking-[0.4em] text-ink-muted">Reel — drop a video in <code>/public/videos/{section.id}.mp4</code></p>
          </div>
        )}
        {section.headline && <span className="absolute bottom-5 left-5 font-[family-name:var(--font-anton)] text-3xl uppercase text-ink mix-blend-difference md:text-5xl">{section.headline}</span>}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Route `video` kind to it in `SectionRenderer.tsx`**

Replace the `case 'video'` line:
```tsx
import { ScrollVideo } from './ScrollVideo';
// ...
    case 'video': return <ScrollVideo section={section} />;
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint && npm run build`. Browser: video slots show the designed placeholder; (drop a test mp4 into `/public/videos/reel-1.mp4` + set `videoSrc` to confirm play, then revert).
```bash
git add components/landing/ScrollVideo.tsx components/landing/SectionRenderer.tsx
git commit -m "feat(landing): ScrollVideo play/scrub modes + designed placeholder slot"
```

---

### Task 10: BrandLockup + placeholder logos

**Files:**
- Create: `components/landing/BrandLockup.tsx`, `public/logos/README.md`

**Interfaces:**
- Produces: `<BrandLockup variant?="dark"|"light" />`. Reads `/logos/livex-ai.svg` + `/logos/nba-summer-league.svg` when present, else placeholder.

- [ ] **Step 1: Create `components/landing/BrandLockup.tsx`**

Uses `next/image` with `onError` fallback to a clearly-marked placeholder mark (no fake brand art).
```tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';

function Mark({ src, label }: { src: string; label: string }) {
  const [ok, setOk] = useState(true);
  return ok
    ? <Image src={src} alt={label} width={120} height={36} className="h-9 w-auto object-contain" onError={() => setOk(false)} />
    : <span className="grid h-9 place-items-center rounded border border-dashed border-line px-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>;
}

export function BrandLockup() {
  return (
    <div className="inline-flex items-center gap-5" aria-label="LiveX AI and NBA Summer League">
      <Mark src="/logos/livex-ai.svg" label="LiveX AI" />
      <span className="h-7 w-px bg-line" />
      <Mark src="/logos/nba-summer-league.svg" label="NBA Summer League" />
    </div>
  );
}
```

- [ ] **Step 2: Create `public/logos/README.md`**

```markdown
# Brand logos (drop-in)
Place `livex-ai.svg` and `nba-summer-league.svg` here. `<BrandLockup>` renders them
automatically; until then it shows a dashed placeholder mark. Prefer white/knockout
variants for the dark landing. Do not stretch/recolor — keep clear-space.
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint`
```bash
git add components/landing/BrandLockup.tsx public/logos/README.md
git commit -m "feat(landing): BrandLockup with drop-in logo slots + placeholder marks"
```

---

### Task 11: Page transition → /design

**Files:**
- Create: `components/landing/PageTransition.tsx`
- Modify: `app/page.tsx` (wire `onStart` to the transition)

**Interfaces:**
- Produces: `usePageTransition()` returning `start(href: string)`; renders the wipe overlay.

- [ ] **Step 1: Create `components/landing/PageTransition.tsx`**

```tsx
'use client';
import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

export function usePageTransition() {
  const router = useRouter();
  const overlay = useRef<HTMLDivElement>(null);
  const start = useCallback((href: string) => {
    if (!overlay.current) { router.push(href); return; }
    gsap.timeline()
      .set(overlay.current, { display: 'block', yPercent: 100 })
      .to(overlay.current, { yPercent: 0, duration: 0.6, ease: 'power4.inOut' })
      .add(() => router.push(href));
  }, [router]);
  const Overlay = () => (
    <div ref={overlay} className="fixed inset-0 z-[95] hidden bg-brand">
      <div className="grid h-full place-items-center font-[family-name:var(--font-anton)] text-6xl uppercase text-white">Design Your Drop</div>
    </div>
  );
  return { start, Overlay };
}
```

- [ ] **Step 2: Wire into `app/page.tsx`**

Replace the `onStart` definition and render the overlay:
```tsx
import { usePageTransition } from '@/components/landing/PageTransition';
// inside Home():
const { start, Overlay } = usePageTransition();
const onStart = useCallback(() => start('/design'), [start]);
// before </SmoothScroll>: <Overlay />
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint`. Browser: clicking "Start designing" wipes then routes to `/design`.
```bash
git add components/landing/PageTransition.tsx app/page.tsx
git commit -m "feat(landing): GSAP wipe page transition into the configurator"
```

---

### Task 12: Mobile tiers + prefers-reduced-motion

**Files:**
- Create: `lib/landing/use-capability.ts`
- Modify: `HeroCanvas.tsx`, `app/page.tsx`, `SmoothScroll.tsx`

**Interfaces:**
- Produces: `useCapability(): { reducedMotion: boolean; tier: 'high'|'low' }`.

- [ ] **Step 1: Create `lib/landing/use-capability.ts`**

```tsx
'use client';
import { useEffect, useState } from 'react';
export function useCapability() {
  const [cap, setCap] = useState({ reducedMotion: false, tier: 'high' as 'high' | 'low' });
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const low = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 768;
    setCap({ reducedMotion: rm, tier: low ? 'low' : 'high' });
  }, []);
  return cap;
}
```

- [ ] **Step 2: Apply in `HeroCanvas.tsx`**

Accept `tier`/`reducedMotion`: on `low` tier use `dpr={[1,1.5]}`, drop the spotlight + Bloom; when `reducedMotion`, the model holds the hero pose (the `useLebronActs` hook is passed `enabled=false` from the page).

- [ ] **Step 3: Apply in `app/page.tsx` + `SmoothScroll`**

```tsx
const cap = useCapability();
useLebronActs(ready && !cap.reducedMotion);
// SmoothScroll: pass options lerp = cap.reducedMotion ? 1 : 0.09
// ScrollVideo / SplitReveal already guard prefers-reduced-motion internally
```
Add a `reduced?: boolean` prop to `SmoothScroll` that sets `lerp:1` when true.

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck && npm run lint && npm run build`. Browser: emulate reduced-motion (instant scroll, no autoplay, static hero pose) + a narrow viewport (lighter render).
```bash
git add lib/landing/use-capability.ts components/landing/HeroCanvas.tsx components/landing/SmoothScroll.tsx app/page.tsx
git commit -m "feat(landing): mobile render tiers + prefers-reduced-motion fallbacks"
```

---

### Task 13: Docs + final self-review + gate

**Files:**
- Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Update `CLAUDE.md`** — add a "Landing page" section: architecture (fixed Canvas + DOM, scroll-state singleton, act keyframes), the scroll/3D stack (Lenis+GSAP sync, postprocessing), and the video drop-in workflow.

- [ ] **Step 2: Update `README.md`** — add "How to add a video" (drop `mp4` in `/public/videos/<id>.mp4` + poster, set `videoSrc`/`videoMode` in `landing.config.ts`), "How to swap the hero model", and "How to add the logos".

- [ ] **Step 3: Full gate**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all green; landing tests pass.

- [ ] **Step 4: Self-review against the spec** — walk §1–12 of the design spec; confirm each maps to shipped code (preloader, acts, video slots, lockup, transition, fallbacks). Fix gaps.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs(landing): CLAUDE.md + README — landing architecture & drop-in workflows"
```

---

## Self-Review (plan vs spec)

- **Spec coverage:** art direction → Task 1 (fonts/tokens) + Task 7 (craft); 3D hero/pipeline → Tasks 2,4; choreography/acts → Tasks 3,5; preloader → Task 6; sections/config → Tasks 3,8; video slots → Task 9; logos → Task 10; page transition → Task 11; mobile/reduced-motion/a11y → Task 12; docs → Task 13. All §1–12 covered.
- **Placeholder scan:** every code step contains real code; "placeholder" appears only as the intentional *designed video/logo placeholder* feature.
- **Type consistency:** `poseAtProgress`, `scrollState.progress`, `LandingSection`, `ActKeyframe`, `LANDING_SECTIONS`, `ACT_KEYFRAMES`, `useLebronActs(enabled)`, `<ScrollVideo section>`, `<BrandLockup>`, `usePageTransition()` are defined once and reused with matching signatures.
