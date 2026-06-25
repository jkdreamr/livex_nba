import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <div className="relative text-center">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-ink-muted">NBA Summer League × LiveX</p>
        <h1 className="mt-3 font-display text-6xl font-semibold leading-[0.95] text-ink sm:text-8xl">
          Design
          <br />
          Your Drop
        </h1>
        <p className="mx-auto mt-5 max-w-md font-sans text-base text-ink-muted">
          Answer five quick questions and watch your custom Summer League hoodie come to life in 3D — then we make it real.
        </p>
        <div className="mt-9">
          <Link
            href="/design"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 font-sans text-base font-semibold text-white transition hover:brightness-110"
          >
            Start designing →
          </Link>
        </div>
        <p className="mt-5 font-sans text-xs text-ink-muted">No account needed · about a minute</p>
      </div>
    </main>
  );
}
