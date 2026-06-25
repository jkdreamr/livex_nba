'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.documentElement.classList.add('lx-cursor');
    const move = (e: MouseEvent) => {
      gsap.to(dot.current, { x: e.clientX, y: e.clientY, duration: 0.25, ease: 'power3.out' });
      const t = (e.target as HTMLElement)?.closest('[data-cursor]') as HTMLElement | null;
      const mode = t?.dataset.cursor;
      gsap.to(dot.current, { scale: mode ? 3.2 : 1, duration: 0.3 });
      if (label.current) label.current.textContent = mode === 'rotate' ? 'drag to rotate' : mode === 'grow' ? '' : '';
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); document.documentElement.classList.remove('lx-cursor'); };
  }, []);
  return (
    <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[90] -ml-2 -mt-2 grid h-4 w-4 place-items-center rounded-full bg-brand mix-blend-difference">
      <span ref={label} className="absolute whitespace-nowrap font-mono text-[8px] text-white" style={{ transform: 'scale(0.31)' }} />
    </div>
  );
}
