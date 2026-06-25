'use client';
import { useProgress } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const { progress, active } = useProgress();

  useEffect(() => {
    if (bar.current) gsap.to(bar.current, { scaleX: progress / 100, duration: 0.4, ease: 'power2.out' });
    if (num.current) num.current.textContent = `${Math.round(progress)}`;
  }, [progress]);

  useEffect(() => {
    if (!active && progress >= 100 && root.current) {
      gsap.timeline()
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.2 })
        .add(() => onDone(), '-=0.2');
    }
  }, [active, progress, onDone]);

  return (
    <div ref={root} className="fixed inset-0 z-[80] grid place-items-center bg-void">
      <div className="w-[min(80vw,520px)]">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-ink-muted">Loading the arena</p>
        <div className="mt-3 flex items-end justify-between">
          <span ref={num} className="font-[family-name:var(--font-anton)] text-7xl text-ink">0</span>
          <span className="font-mono text-sm text-ink-muted">/100</span>
        </div>
        <div className="mt-4 h-px w-full bg-line">
          <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-brand" />
        </div>
      </div>
    </div>
  );
}
