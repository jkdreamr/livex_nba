'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { generate } from '@/lib/engine/generate';
import type { Density, HoodieColor, Vibe } from '@/lib/catalog/types';

const HoodieViewer = dynamic<{ spec: import('@/lib/catalog/types').DesignSpec }>(
  () => import('@/components/three/HoodieViewer').then((m) => m.HoodieViewer),
  { ssr: false, loading: () => <div className="grid h-full place-items-center text-ink-muted">Loading 3D…</div> },
);

const COLORS: HoodieColor[] = ['bone', 'black', 'grey', 'white'];
const DENSITIES: Density[] = ['minimal', 'balanced', 'maximal'];
const VIBES: Vibe[] = ['classic', 'vegas', 'streetwear', 'playful'];

// Dev preview: tweak inputs and watch the engine + 3D update live.
export default function PreviewPage() {
  const [color, setColor] = useState<HoodieColor>('black');
  const [density, setDensity] = useState<Density>('maximal');
  const [vibe, setVibe] = useState<Vibe>('vegas');

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

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`rounded-full px-3 py-1.5 font-sans text-sm capitalize ${
              color === c ? 'bg-brand text-white' : 'bg-surface-raised text-ink-muted'
            }`}
          >
            {c}
          </button>
        ))}
        <span className="w-px self-stretch bg-line" />
        {DENSITIES.map((d) => (
          <button
            key={d}
            onClick={() => setDensity(d)}
            className={`rounded-full px-3 py-1.5 font-sans text-sm capitalize ${
              density === d ? 'bg-brand text-white' : 'bg-surface-raised text-ink-muted'
            }`}
          >
            {d}
          </button>
        ))}
        <span className="w-px self-stretch bg-line" />
        {VIBES.map((v) => (
          <button
            key={v}
            onClick={() => setVibe(v)}
            className={`rounded-full px-3 py-1.5 font-sans text-sm capitalize ${
              vibe === v ? 'bg-brand text-white' : 'bg-surface-raised text-ink-muted'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <HoodieViewer spec={spec} />
    </main>
  );
}
