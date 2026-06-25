'use client';
import Image from 'next/image';
import { useState } from 'react';

function Mark({ src, label, className }: { src: string; label: string; className: string }) {
  const [ok, setOk] = useState(true);
  return ok
    ? <Image src={src} alt={label} width={160} height={48} unoptimized className={`w-auto object-contain ${className}`} onError={() => setOk(false)} />
    : <span className={`grid place-items-center rounded border border-dashed border-black/20 px-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted ${className}`}>{label}</span>;
}

export function BrandLockup() {
  return (
    <div className="inline-flex flex-col items-center gap-3.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.45em] text-ink-muted/70">In partnership with</span>
      {/* A clean, top-lit pill: the NBA badge is dark, detailed artwork that needs
          a light surface to read, so we lean into it as an intentional partner
          card. The two marks are sized for equal optical weight (the wide LiveX
          wordmark shorter, the squarer NBA badge taller), and a brand-blue glow
          ties the white card back to the arena page instead of floating on it. */}
      <div
        className="inline-flex items-center gap-7 rounded-full bg-[linear-gradient(180deg,#FFFFFF,#EEF1F6)] px-8 py-3 shadow-[0_26px_70px_-24px_rgba(40,69,231,0.55)] ring-1 ring-black/[0.06]"
        aria-label="LiveX and NBA Summer League"
      >
        <Mark src="/logos/livex-ai.svg" label="LiveX" className="h-5 sm:h-[1.4rem]" />
        <span className="h-9 w-px bg-black/10" />
        <Mark src="/logos/nba-summer-league.svg" label="NBA Summer League" className="h-11 sm:h-12" />
      </div>
    </div>
  );
}
