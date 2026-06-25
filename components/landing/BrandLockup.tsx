'use client';
import Image from 'next/image';
import { useState } from 'react';

function Mark({ src, label }: { src: string; label: string }) {
  const [ok, setOk] = useState(true);
  return ok
    ? <Image src={src} alt={label} width={120} height={36} className="h-9 w-auto object-contain" onError={() => setOk(false)} />
    : <span className="grid h-9 place-items-center rounded border border-dashed border-line px-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>;
}

export function BrandLockup() {
  return (
    <div className="inline-flex items-center gap-5" aria-label="LiveX AI and NBA Summer League">
      <Mark src="/logos/livex-ai.svg" label="LiveX AI" />
      <span className="h-7 w-px bg-line" />
      <Mark src="/logos/nba-summer-league.svg" label="NBA Summer League" />
    </div>
  );
}
