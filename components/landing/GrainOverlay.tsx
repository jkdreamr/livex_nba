'use client';
import { useEffect } from 'react';
export function GrainOverlay() {
  useEffect(() => { document.documentElement.classList.add('lx-grain'); return () => document.documentElement.classList.remove('lx-grain'); }, []);
  return <div className="pointer-events-none fixed inset-0 z-[55]" style={{ background: 'radial-gradient(120% 80% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />;
}
