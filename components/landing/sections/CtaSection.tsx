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
