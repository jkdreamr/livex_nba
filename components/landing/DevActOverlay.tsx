'use client';
import { useEffect, useState } from 'react';
import { scrollState } from '@/lib/landing/scroll-state';
import { poseAtProgress } from '@/lib/landing/acts';

export function DevActOverlay() {
  const [, force] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => { force((n) => n + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (process.env.NODE_ENV === 'production') return null;
  const p = scrollState.progress;
  const pose = poseAtProgress(p);
  return (
    <div className="fixed bottom-3 left-3 z-[70] rounded-lg border border-line bg-black/70 px-3 py-2 font-mono text-[11px] text-ink-muted backdrop-blur">
      progress {p.toFixed(3)} · rotY {pose.rotationY.toFixed(0)}° · scale {pose.scale.toFixed(2)} · x {pose.position[0].toFixed(2)}
    </div>
  );
}
