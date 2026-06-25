'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { generate } from '@/lib/engine/generate';
import type { Density, HoodieColor, Vibe } from '@/lib/catalog/types';

const HoodieViewer = dynamic<{
  spec: import('@/lib/catalog/types').DesignSpec;
  autoRotate?: boolean;
  spinY?: number;
}>(() => import('@/components/three/HoodieViewer').then((m) => m.HoodieViewer), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-ink-muted">Loading 3D…</div>,
});

const COLORS: HoodieColor[] = ['bone', 'black', 'grey', 'white'];
const DENSITIES: Density[] = ['minimal', 'balanced', 'maximal'];
const VIBES: Vibe[] = ['classic', 'vegas', 'streetwear', 'playful'];
const ANGLES: { label: string; y: number }[] = [
  { label: 'front', y: 0 },
  { label: 'right', y: -Math.PI / 2 },
  { label: 'back', y: Math.PI },
  { label: 'left', y: Math.PI / 2 },
];

const chip = (active: boolean) =>
  `rounded-full px-3 py-1.5 font-sans text-sm capitalize ${
    active ? 'bg-brand text-white' : 'bg-surface-raised text-ink-muted'
  }`;

export default function PreviewPage() {
  const [color, setColor] = useState<HoodieColor>('black');
  const [density, setDensity] = useState<Density>('maximal');
  const [vibe, setVibe] = useState<Vibe>('vegas');
  const [spin, setSpin] = useState(0);
  const [auto, setAuto] = useState(false);

  const spec = useMemo(
    () =>
      generate({
        hoodieColor: color,
        teamsRanked: ['celtics', 'warriors', 'lakers'],
        density,
        vibe,
        mustHaveId: 'plc_40_flamingo',
      }),
    [color, density, vibe],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-sm">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">Preview · dev</p>
        <h1 className="font-display text-3xl capitalize text-ink">{color} hoodie</h1>
        <p className="mt-1 font-sans text-sm text-ink-muted">{spec.rationale}</p>
        <p className="mt-1 font-sans text-xs text-ink-muted">
          back: {spec.backGraphic.id} · {spec.patches.length} patches
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur">
        {COLORS.map((c) => (
          <button key={c} data-color={c} onClick={() => setColor(c)} className={chip(color === c)}>
            {c}
          </button>
        ))}
        <span className="w-px self-stretch bg-line" />
        {DENSITIES.map((d) => (
          <button key={d} data-density={d} onClick={() => setDensity(d)} className={chip(density === d)}>
            {d}
          </button>
        ))}
        <span className="w-px self-stretch bg-line" />
        {VIBES.map((v) => (
          <button key={v} data-vibe={v} onClick={() => setVibe(v)} className={chip(vibe === v)}>
            {v}
          </button>
        ))}
        <span className="w-px self-stretch bg-line" />
        {ANGLES.map((a) => (
          <button
            key={a.label}
            data-spin={a.label}
            onClick={() => {
              setAuto(false);
              setSpin(a.y);
            }}
            className={chip(!auto && spin === a.y)}
          >
            {a.label}
          </button>
        ))}
        <button data-spin="auto" onClick={() => setAuto((v) => !v)} className={chip(auto)}>
          ⟳ spin
        </button>
      </div>

      <HoodieViewer spec={spec} autoRotate={auto} spinY={spin} />
    </main>
  );
}
