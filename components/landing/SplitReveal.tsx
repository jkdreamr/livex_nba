'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(useGSAP, SplitText);
export function SplitReveal({ text, className = '', as = 'h2' }: { text: string; className?: string; as?: 'h1' | 'h2' }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const split = new SplitText(ref.current, { type: 'chars,words' });
    gsap.from(split.chars, {
      yPercent: 120, opacity: 0, stagger: 0.02, duration: 0.9, ease: 'power4.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%' },
    });
  }, { scope: ref });
  const Tag = as;
  return <Tag ref={ref} className={className}>{text}</Tag>;
}
