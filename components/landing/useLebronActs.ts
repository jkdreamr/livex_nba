'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState } from '@/lib/landing/scroll-state';
gsap.registerPlugin(ScrollTrigger);

/** One trigger over the whole scroll container writes 0..1 into scrollState. */
export function useLebronActs(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => { scrollState.progress = self.progress; },
    });
    return () => st.kill();
  }, [enabled]);
}
