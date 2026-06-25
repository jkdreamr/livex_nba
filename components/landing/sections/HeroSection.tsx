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
