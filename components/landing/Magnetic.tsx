'use client';
import { useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    return () => { if (el) gsap.killTweensOf(el); };
  }, []);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: 0.5, ease: 'power3.out' });
  };
  const reset = () => { if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }); };
  return <span ref={ref} onMouseMove={onMove} onMouseLeave={reset} className="inline-block" data-cursor="grow">{children}</span>;
}
