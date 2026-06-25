'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { LandingSection } from '@/lib/landing/landing.config';
gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ScrollVideo({ section }: { section: LandingSection }) {
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(section.videoSrc);
  const mode = section.videoMode ?? 'play';

  useGSAP(() => {
    if (!hasVideo || !vid.current) return;
    const v = vid.current;
    if (mode === 'scrub') {
      const set = () => ScrollTrigger.create({
        trigger: wrap.current, start: 'top bottom', end: 'bottom top', scrub: true,
        onUpdate: (s) => { if (v.duration) v.currentTime = s.progress * v.duration; },
      });
      if (v.readyState >= 1) { set(); } else { v.addEventListener('loadedmetadata', set, { once: true }); }
    } else {
      ScrollTrigger.create({
        trigger: wrap.current, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => v.play().catch(() => {}), onLeave: () => v.pause(),
        onEnterBack: () => v.play().catch(() => {}), onLeaveBack: () => v.pause(),
      });
    }
  }, { scope: wrap, dependencies: [hasVideo, mode] });

  return (
    <section ref={wrap} className="relative grid min-h-dvh place-items-center px-6">
      <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-line">
        {hasVideo ? (
          <video ref={vid} src={section.videoSrc} poster={section.poster} muted playsInline preload="metadata"
            loop={mode === 'play'} className="h-full w-full object-cover" />
        ) : (
          // designed placeholder — looks intentional before any file exists
          <div className="grid h-full w-full place-items-center bg-[linear-gradient(120deg,#0B0D14,#04050A_60%)]">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(60%_60%_at_50%_50%,rgba(40,69,231,0.25),transparent_70%)]" />
            <p className="relative font-mono text-xs uppercase tracking-[0.4em] text-ink-muted">Reel — drop a video in <code>/public/videos/{section.id}.mp4</code></p>
          </div>
        )}
        {section.headline && <span className="absolute bottom-5 left-5 font-[family-name:var(--font-anton)] text-3xl uppercase text-ink mix-blend-difference md:text-5xl">{section.headline}</span>}
      </div>
    </section>
  );
}
