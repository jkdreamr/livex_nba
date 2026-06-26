'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { Density, DesignSpec, QuestionnaireAnswers } from '@/lib/catalog/types';
import { generate } from '@/lib/engine/generate';
import { backById } from '@/lib/catalog';
import { HOODIE_COLORS } from '@/lib/catalog/hoodie-colors';
import { TEAMS } from '@/lib/catalog/teams';
import { DENSITY_OPTIONS } from '@/lib/questionnaire/options';
import { PrimaryButton, GhostButton } from './primitives';
import { LandingLink } from '@/components/navigation/LandingLink';

const HoodieThumb = dynamic<{ spec: DesignSpec }>(
  () => import('@/components/three/HoodieThumb').then((m) => m.HoodieThumb),
  {
    ssr: false,
    loading: () => <div className="grid h-full place-items-center font-sans text-xs text-ink-muted">Loading</div>,
  },
);

// Franchise picks resolve to a TEAMS label; league/event "rep" picks use a
// back-graphic-id slug, so fall back to that graphic's label (never the raw id).
const teamLabel = (slug: string) => TEAMS.find((t) => t.slug === slug)?.label ?? backById(slug)?.label ?? slug;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Reveal({
  answers,
  onEdit,
  onRestart,
}: {
  answers: QuestionnaireAnswers;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const [density, setDensity] = useState<Density>(answers.density ?? 'balanced');
  const [seed, setSeed] = useState(0);
  const [sending, setSending] = useState(false);

  // One design per mix (Minimal / Balanced / Maximal), shown side by side and
  // re-rolled together by the seed (Regenerate). Same team, three patch mixes.
  const specs = useMemo(() => {
    const out = {} as Record<Density, DesignSpec | null>;
    for (const d of ['minimal', 'balanced', 'maximal'] as Density[]) {
      try {
        out[d] = generate({ ...answers, density: d, seed });
      } catch {
        out[d] = null;
      }
    }
    return out;
  }, [answers, seed]);

  if (sending) return <SendingScreen />;

  const title = answers.teamsRanked[0] ? teamLabel(answers.teamsRanked[0]) : 'Summer League';
  const colorLabel = HOODIE_COLORS.find((c) => c.id === answers.hoodieColor)?.label ?? answers.hoodieColor;
  const summary = `${colorLabel} · ${cap(answers.vibe)} · ${answers.audience === 'kid' ? 'Youth' : 'Adult'} ${answers.size ?? 'M'}`;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <LandingLink />

      <div className="relative w-full max-w-4xl text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">Your hoodie is ready</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {title} <span className="text-ink-muted">{/summer league/i.test(title) ? 'Hoodie' : 'Summer League hoodie'}</span>
        </h1>
        <p className="mt-3 font-sans text-sm text-ink-muted">Three mixes, same team — tap the one you want.</p>

        {/* Three hoodies to choose from — same team, Minimal / Balanced / Maximal. */}
        <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-4">
          {DENSITY_OPTIONS.map((d) => {
            const sp = specs[d.id];
            const selected = density === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDensity(d.id)}
                aria-pressed={selected}
                className={`group overflow-hidden rounded-2xl border bg-surface transition ${
                  selected ? 'border-brand ring-2 ring-brand/40' : 'border-line hover:border-ink-muted'
                }`}
              >
                <div className="pointer-events-none relative aspect-[4/5] w-full">
                  {sp ? (
                    <HoodieThumb spec={sp} />
                  ) : (
                    <div className="grid h-full place-items-center font-sans text-xs text-ink-muted">—</div>
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-white shadow">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5 text-left">
                  <span className="block font-display text-sm font-semibold text-ink">{d.label}</span>
                  <span className="block font-sans text-[11px] text-ink-muted">
                    {sp ? `${sp.patches.length} patch${sp.patches.length === 1 ? '' : 'es'}` : `up to ${d.max}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-5 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">{summary}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            data-cursor="grow"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-5 py-2.5 font-sans text-sm font-medium text-ink transition hover:border-brand hover:bg-surface"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
            </svg>
            Regenerate
          </button>
          <GhostButton onClick={onEdit}>Edit answers</GhostButton>
          <GhostButton onClick={onRestart}>Start over</GhostButton>
          <PrimaryButton onClick={() => setSending(true)}>Send over</PrimaryButton>
        </div>
      </div>
    </main>
  );
}

// Terminal "handing it off" screen. It fills the bar and holds — there's no
// auto-advance; the fan leaves via the home button.
function SendingScreen() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <LandingLink />
      <div className="relative w-full max-w-sm">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">Almost there</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Sending over</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
          Handing your hoodie to the LiveX crew to make it real.
        </p>
        <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand" style={{ width: '6%', animation: 'lx-send-fill 2.4s ease-out forwards' }} />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">Hang tight</p>
      </div>
    </main>
  );
}
