'use client';
import { useEffect, useState } from 'react';

export function useCapability() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tier, setTier] = useState<'high' | 'low'>('high');

  useEffect(() => {
    const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: coarse)');

    const evaluate = () => {
      const rm = rmQuery.matches;
      const low = pointerQuery.matches && Math.min(window.innerWidth, window.innerHeight) < 768;
      setReducedMotion(rm);
      setTier(low ? 'low' : 'high');
    };

    evaluate();

    rmQuery.addEventListener('change', evaluate);
    pointerQuery.addEventListener('change', evaluate);
    window.addEventListener('resize', evaluate);
    return () => {
      rmQuery.removeEventListener('change', evaluate);
      pointerQuery.removeEventListener('change', evaluate);
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  return { reducedMotion, tier };
}
