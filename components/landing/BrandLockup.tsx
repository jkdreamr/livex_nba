'use client';
import Image from 'next/image';
import { useState } from 'react';

function Mark({ src, label, className }: { src: string; label: string; className: string }) {
  const [ok, setOk] = useState(true);
  return ok
    ? <Image src={src} alt={label} width={160} height={48} unoptimized className={`w-auto object-contain ${className}`} onError={() => setOk(false)} />
    : <span className={`grid place-items-center rounded border border-dashed border-white/20 px-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted ${className}`}>{label}</span>;
}

export function BrandLockup() {
  return (
    <div className="inline-flex flex-col items-center gap-3.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.45em] text-ink-muted/70">In partnership with</span>
      {/* No backing panel — the marks sit straight on the arena-black page. The
          LiveX wordmark is a single-colour brand-blue asset that goes dim on
          black, so it's reversed to white (still the exact asset, just knocked
          out); the NBA Summer League badge keeps its official colours, which
          read on their own. Sizes are tuned for equal optical weight. */}
      <div className="inline-flex items-center gap-7" aria-label="LiveX and NBA Summer League">
        <Mark src="/logos/livex-ai.svg" label="LiveX" className="h-5 brightness-0 invert sm:h-[1.4rem]" />
        <span className="h-9 w-px bg-white/15" />
        <Mark src="/logos/nba-summer-league.svg" label="NBA Summer League" className="h-12 sm:h-14" />
      </div>
    </div>
  );
}
