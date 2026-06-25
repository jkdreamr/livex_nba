'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DesignSpec, QuestionnaireAnswers } from '@/lib/catalog/types';
import { backById, placementById } from '@/lib/catalog';
import { HOODIE_COLORS } from '@/lib/catalog/hoodie-colors';
import { TEAMS } from '@/lib/catalog/teams';
import { PrimaryButton, GhostButton } from './primitives';
import { LandingLink } from '@/components/navigation/LandingLink';
import { DESIGN_SPEC_SESSION_KEY } from '@/lib/store/design-session';

const HoodieViewer = dynamic<{
  spec: DesignSpec;
  autoRotate?: boolean;
  spinY?: number;
}>(() => import('@/components/three/HoodieViewer').then((m) => m.HoodieViewer), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center font-sans text-sm text-ink-muted">Loading your hoodie</div>
  ),
});

const ANGLES: { label: string; y: number }[] = [
  { label: 'Front', y: 0 },
  { label: 'Right', y: -Math.PI / 2 },
  { label: 'Back', y: Math.PI },
  { label: 'Left', y: Math.PI / 2 },
];

// Franchise picks resolve to a TEAMS label; league/event "rep" picks use a
// back-graphic-id slug, so fall back to that graphic's label (never the raw id).
const teamLabel = (slug: string) => TEAMS.find((t) => t.slug === slug)?.label ?? backById(slug)?.label ?? slug;

export function Reveal({
  spec,
  answers,
  onEdit,
  onRestart,
}: {
  spec: DesignSpec;
  answers: QuestionnaireAnswers;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const [spin, setSpin] = useState(0);
  const [auto, setAuto] = useState(true);

  const title = answers.teamsRanked[0] ? teamLabel(answers.teamsRanked[0]) : 'Summer League';
  const colorLabel = HOODIE_COLORS.find((c) => c.id === spec.hoodieColor)?.label ?? spec.hoodieColor;
  const backLabel = backById(spec.backGraphic.id)?.label ?? spec.backGraphic.id;
  const patchLabels = spec.patches
    .map((p) => placementById(p.id)?.label)
    .filter((l): l is string => Boolean(l));

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 font-sans text-xs font-medium transition ${
      active ? 'bg-brand text-white' : 'bg-surface-raised text-ink-muted hover:text-ink'
    }`;

  const openMyLook = () => {
    window.sessionStorage.setItem(DESIGN_SPEC_SESSION_KEY, JSON.stringify(spec));
    router.push('/my-look');
  };

  return (
    <main className="relative min-h-dvh lg:grid lg:grid-cols-[1.15fr_0.85fr]">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <LandingLink />

      {/* 3D stage */}
      <section className="relative h-[58vh] lg:h-dvh">
        <HoodieViewer spec={spec} autoRotate={auto} spinY={spin} />
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-1.5 rounded-full border border-line bg-surface/70 p-1.5 backdrop-blur">
          {ANGLES.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setAuto(false);
                setSpin(a.y);
              }}
              className={chip(!auto && spin === a.y)}
            >
              {a.label}
            </button>
          ))}
          <button onClick={() => setAuto((v) => !v)} className={chip(auto)}>
            Spin
          </button>
        </div>
      </section>

      {/* details */}
      <section className="relative flex flex-col justify-center gap-6 px-6 py-10 lg:px-10">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">Your hoodie is ready</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {title}
            <span className="block text-ink-muted">{/summer league/i.test(title) ? 'Hoodie' : 'Summer League hoodie'}</span>
          </h1>
          <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-ink-muted">{spec.rationale}</p>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          <SpecCell label="Color" value={colorLabel} />
          <SpecCell label="Back graphic" value={backLabel} />
          <SpecCell label="Style" value={cap(spec.meta.vibe)} />
          <SpecCell label="Patch count" value={`${cap(spec.densityTier)} / ${spec.patches.length} patch${spec.patches.length === 1 ? '' : 'es'}`} />
        </dl>

        {patchLabels.length > 0 && (
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">Patches</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patchLabels.map((l, i) => (
                <span key={`${l}-${i}`} className="rounded-full border border-line bg-surface-raised px-2.5 py-1 font-sans text-xs text-ink">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="font-sans text-xs text-ink-muted">
          Approved Summer League graphics, placed for embroidery. The preview matches the final layout.
        </p>

        <div className="flex flex-wrap gap-3">
          <GhostButton onClick={onEdit}>Edit answers</GhostButton>
          <GhostButton onClick={onRestart}>Start over</GhostButton>
          <PrimaryButton onClick={openMyLook}>My Look</PrimaryButton>
        </div>
      </section>
    </main>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-sans text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
