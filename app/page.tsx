'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SmoothScroll } from '@/components/landing/SmoothScroll';
import { Preloader } from '@/components/landing/Preloader';
import { Cursor } from '@/components/landing/Cursor';
import { GrainOverlay } from '@/components/landing/GrainOverlay';
import { Marquee } from '@/components/landing/Marquee';
import { DevActOverlay } from '@/components/landing/DevActOverlay';
import { SectionRenderer } from '@/components/landing/SectionRenderer';
import { useLebronActs } from '@/components/landing/useLebronActs';
import { usePageTransition } from '@/components/landing/PageTransition';
import { LANDING_SECTIONS } from '@/lib/landing/landing.config';

const HeroCanvas = dynamic(
  () => import('@/components/landing/HeroCanvas').then((m) => m.HeroCanvas),
  { ssr: false },
);

export default function Home() {
  const [ready, setReady] = useState(false);
  useLebronActs(ready);
  const { start, Overlay } = usePageTransition();
  const onStart = useCallback(() => start('/design'), [start]);
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
      <Overlay />
    </SmoothScroll>
  );
}
