export default function Home() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <div className="relative text-center">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-ink-muted">NBA Summer League × LiveX</p>
        <h1 className="font-display text-5xl font-semibold text-ink sm:text-7xl">Design Your Drop</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-ink-muted">
          Answer five quick questions. We design your hoodie.
        </p>
        <span className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-sans font-semibold text-white">
          Coming together…
        </span>
      </div>
    </main>
  );
}
