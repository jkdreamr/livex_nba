'use client';
import Link from 'next/link';
import { SplitReveal } from '../SplitReveal';
import { Magnetic } from '../Magnetic';
import type { LandingSection } from '@/lib/landing/landing.config';
export function ContentSection({ section }: { section: LandingSection }) {
  return (
    <section aria-label="Hoodie details" className="relative grid min-h-dvh items-center px-6 md:px-16">
      <div className="max-w-2xl">
        <span className="font-mono text-xs text-brand">(02 - THE HOODIE)</span>
        <SplitReveal text={section.headline ?? ''} className="mt-3 font-[family-name:var(--font-anton)] text-6xl uppercase leading-[0.9] text-ink md:text-8xl" />
        <p className="mt-6 max-w-md font-sans text-lg text-ink-muted">{section.body}</p>
        <Magnetic>
          <Link href="/design" data-cursor="grow" className="mt-8 inline-flex rounded-full bg-brand px-7 py-3 font-sans text-sm font-semibold text-white">Start designing</Link>
        </Magnetic>
      </div>
    </section>
  );
}
