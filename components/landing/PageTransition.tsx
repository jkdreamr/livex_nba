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
      <div className="grid h-full place-items-center font-[family-name:var(--font-anton)] text-6xl uppercase text-white">Make Your Hoodie</div>
    </div>
  );
  return { start, Overlay };
}
