'use client';

import type { ReactNode } from 'react';

export function StepHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-md font-sans text-sm text-ink-muted">{subtitle}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 font-sans text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 font-sans text-sm font-medium text-ink-muted transition hover:border-ink-muted hover:text-ink"
    >
      {children}
    </button>
  );
}

/** A selectable card used across the option steps. */
export function SelectTile({
  selected,
  onClick,
  children,
  badge,
  className = '',
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex flex-col rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-brand bg-brand/10 ring-1 ring-brand'
          : 'border-line bg-surface-raised hover:border-ink-muted/50'
      } ${className}`}
    >
      {badge && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
      {children}
    </button>
  );
}
