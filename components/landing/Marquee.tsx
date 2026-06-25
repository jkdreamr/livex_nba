'use client';
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line py-3" aria-hidden>
      <div className="flex w-max animate-[lxmarquee_28s_linear_infinite] gap-8 font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-ink-muted">
        {row.map((t, i) => (<span key={i} className="flex items-center gap-8">{t}<span className="text-brand">•</span></span>))}
      </div>
      <style>{`@keyframes lxmarquee{to{transform:translateX(-33.33%)}}`}</style>
    </div>
  );
}
