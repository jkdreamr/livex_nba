'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Audience, HoodieColor, QuestionnaireAnswers, Vibe } from '@/lib/catalog/types';
import { HOODIE_COLORS } from '@/lib/catalog/hoodie-colors';
import { TEAMS, FEATURE_OPTIONS } from '@/lib/catalog/teams';
import { VIBE_OPTIONS, AUDIENCE_OPTIONS, SIZES_BY_AUDIENCE, DEFAULT_SIZE } from '@/lib/questionnaire/options';
import { StepHeading, PrimaryButton, GhostButton, SelectTile } from './primitives';
import { Reveal } from './Reveal';
import { LandingLink } from '@/components/navigation/LandingLink';

const STEPS = ['Team', 'Color', 'Size', 'Style'] as const;
const MAX_TEAMS = 3;

// A full-bleed, low-opacity backdrop of Summer League gameplay that runs behind
// the whole questionnaire (every step), so the flow feels immersive without
// hurting legibility. Mounted once so it plays continuously across steps. Swap
// BACKDROP_SRC for other footage (drop it in /public/videos). Degrades to the
// scrim alone if the file is missing.
const BACKDROP_SRC = '/videos/patch-bg.mp4';

function FlowBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-[0.6]"
      >
        <source src={BACKDROP_SRC} type="video/mp4" />
      </video>
      {/* light scrim so the gameplay reads clearly, with a touch more darkening
          at the very top/bottom edges to keep the heading and footer legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}

export function DesignWizard() {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [teams, setTeams] = useState<string[]>([]);
  const [hoodieColor, setHoodieColor] = useState<HoodieColor>('black');
  const [audience, setAudience] = useState<Audience>('adult');
  const [size, setSize] = useState<string>('M');
  const [vibe, setVibe] = useState<Vibe>('vegas');
  const [query, setQuery] = useState('');

  // Switching audience just keeps the chosen size valid for the new band.
  const chooseAudience = (next: Audience) => {
    setAudience(next);
    if (!SIZES_BY_AUDIENCE[next].includes(size)) setSize(DEFAULT_SIZE[next]);
  };

  // Patches and the patch count (density) are decided automatically and tuned at
  // the reveal — `density: 'balanced'` is just the starting mix the reveal opens
  // on; the fan switches Minimal / Balanced / Maximal there.
  const answers: QuestionnaireAnswers = useMemo(
    () => ({ hoodieColor, teamsRanked: teams, density: 'balanced', vibe, audience, size }),
    [hoodieColor, teams, vibe, audience, size],
  );

  const toggleTeam = (slug: string) =>
    setTeams((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < MAX_TEAMS
          ? [...prev, slug]
          : prev,
    );

  const canAdvance = step !== 0 || teams.length > 0;
  const isLast = step === STEPS.length - 1;

  if (revealed && teams.length > 0) {
    return (
      <Reveal
        answers={answers}
        onEdit={() => setRevealed(false)}
        onRestart={() => {
          setRevealed(false);
          setStep(0);
          setTeams([]);
          setHoodieColor('black');
          setAudience('adult');
          setSize('M');
          setVibe('vegas');
          setQuery('');
        }}
      />
    );
  }

  const filteredTeams = TEAMS.filter((t) => t.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="relative flex min-h-dvh flex-col px-5 pb-8 pt-6">
      <FlowBackdrop />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <LandingLink />

      {/* progress */}
      <header className="relative mx-auto w-full max-w-5xl pl-14 sm:pl-0">
        <div className="flex items-center justify-between">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">NBA Summer League x LiveX</p>
          <p className="font-sans text-xs text-ink-muted">
            Step {step + 1} <span className="opacity-50">/ {STEPS.length}</span>
          </p>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: i < step ? '100%' : i === step ? '60%' : '0%' }}
              />
            </div>
          ))}
        </div>
      </header>

      {/* step body */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-8">
        {step === 0 && (
          <div>
            <StepHeading
              eyebrow="Who do you rep?"
              title="Who are you wearing?"
              subtitle={`Your first pick goes on the back. Rep the league or pick up to ${MAX_TEAMS} teams. Tap order sets the rank.`}
            />

            {/* League / event options for fans who don't rep a single franchise. */}
            <div className="mx-auto mt-6 w-full max-w-xl">
              <p className="mb-2.5 text-center font-sans text-[11px] uppercase tracking-[0.25em] text-ink-muted">
                No single team? Rep the league
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {FEATURE_OPTIONS.map((o) => {
                  const rank = teams.indexOf(o.slug);
                  return (
                    <SelectTile
                      key={o.slug}
                      selected={rank >= 0}
                      onClick={() => toggleTeam(o.slug)}
                      badge={rank >= 0 ? rank + 1 : undefined}
                      className="items-center"
                    >
                      <div className="relative mx-auto h-12 w-full">
                        <Image src={o.logo} alt="" fill sizes="140px" className="object-contain" />
                      </div>
                      <span className="mt-2 w-full text-center font-sans text-xs font-medium text-ink">{o.label}</span>
                    </SelectTile>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto mt-6 flex max-w-md items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-ink-muted">or pick a franchise</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="mx-auto mt-4 max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 30 teams"
                className="w-full rounded-full border border-line bg-surface-raised px-5 py-3 font-sans text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand"
              />
            </div>
            <div className="mt-4 grid max-h-[36vh] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
              {filteredTeams.map((t) => {
                const rank = teams.indexOf(t.slug);
                return (
                  <SelectTile
                    key={t.slug}
                    selected={rank >= 0}
                    onClick={() => toggleTeam(t.slug)}
                    badge={rank >= 0 ? rank + 1 : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        <Image src={t.logo} alt="" fill sizes="44px" className="object-contain" />
                      </div>
                      <span className="font-sans text-sm font-medium text-ink">{t.label}</span>
                    </div>
                  </SelectTile>
                );
              })}
              {filteredTeams.length === 0 && (
                <p className="col-span-full py-8 text-center font-sans text-sm text-ink-muted">No teams found for &quot;{query}&quot;.</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <StepHeading eyebrow="Color" title="Choose the hoodie color" subtitle="Three heavyweight fleece options." />
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {HOODIE_COLORS.map((c) => (
                <SelectTile key={c.id} selected={hoodieColor === c.id} onClick={() => setHoodieColor(c.id)}>
                  <span
                    className="mb-3 h-24 w-full rounded-xl border border-line"
                    style={{ background: c.hex }}
                  />
                  <span className="font-sans text-sm font-semibold text-ink">{c.label}</span>
                </SelectTile>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <StepHeading
              eyebrow="Fit"
              title="Who's it for?"
              subtitle="The hoodie is unisex, just pick a size. Kid keeps the design all-ages."
            />
            <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3">
              {AUDIENCE_OPTIONS.map((a) => (
                <SelectTile key={a.id} selected={audience === a.id} onClick={() => chooseAudience(a.id)}>
                  <span className="font-display text-lg font-semibold text-ink">{a.label}</span>
                  <p className="mt-1.5 font-sans text-sm text-ink-muted">{a.blurb}</p>
                </SelectTile>
              ))}
            </div>
            <p className="mt-7 text-center font-sans text-[11px] uppercase tracking-[0.25em] text-ink-muted">
              {audience === 'kid' ? 'Youth size' : 'Adult size'}
            </p>
            <div className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-2.5 sm:grid-cols-6">
              {SIZES_BY_AUDIENCE[audience].map((s) => (
                <SelectTile key={s} selected={size === s} onClick={() => setSize(s)} className="items-center justify-center">
                  <span className="py-2 font-display text-base font-semibold text-ink">{s}</span>
                </SelectTile>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <StepHeading eyebrow="Style" title="Choose the look" subtitle="Each style pulls in its own kind of stickers." />
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {VIBE_OPTIONS.map((v) => (
                <SelectTile key={v.id} selected={vibe === v.id} onClick={() => setVibe(v.id)}>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: v.accent }} />
                    <span className="font-display text-lg font-semibold text-ink">{v.label}</span>
                  </div>
                  <p className="mt-2 font-sans text-sm text-ink-muted">{v.blurb}</p>
                  {/* example stickers this style surfaces */}
                  <div className="mt-3 flex gap-1.5">
                    {v.preview.map((src) => (
                      <span key={src} className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-raised">
                        <Image src={src} alt="" fill sizes="36px" className="object-contain p-1" />
                      </span>
                    ))}
                  </div>
                </SelectTile>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* nav */}
      <footer className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
        {step > 0 ? <GhostButton onClick={() => setStep((s) => s - 1)}>Back</GhostButton> : <span />}
        {isLast ? (
          <PrimaryButton onClick={() => setRevealed(true)} disabled={teams.length === 0}>
            Show my hoodie
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Next
          </PrimaryButton>
        )}
      </footer>
    </main>
  );
}
