'use client';
import Image from 'next/image';
import { useState } from 'react';

function Mark({ src, label }: { src: string; label: string }) {
  const [ok, setOk] = useState(true);
  return ok
    ? <Image src={src} alt={label} width={120} height={36} unoptimized className="h-9 w-auto object-contain" onError={() => setOk(false)} />
    : <span className="grid h-9 place-items-center rounded border border-dashed border-line px-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>;
}

export function BrandLockup() {
  return (
    <div className="inline-flex flex-col items-center gap-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">Official partners</span>
      {/* Light panel so both marks read on the dark arena page (the NBA badge is
          dark artwork; the LiveX mark is brand-blue — both sit cleanly on ink). */}
      <div
        className="inline-flex items-center gap-5 rounded-2xl bg-ink px-6 py-3.5 shadow-[0_14px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-black/5"
        aria-label="LiveX AI and NBA Summer League"
      >
        <Mark src="/logos/livex-ai.svg" label="LiveX AI" />
        <span className="h-7 w-px bg-black/15" />
        <Mark src="/logos/nba-summer-league.svg" label="NBA Summer League" />
      </div>
    </div>
  );
}
