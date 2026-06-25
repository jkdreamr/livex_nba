import Link from 'next/link';

/**
 * Home / return-to-landing control. Arena-black glass disc with an electric-blue
 * glow on hover and a subtle "lift home" icon nudge. The press uses scale (not
 * layout) so the disc never shifts. 44px target, visible focus ring, and
 * reduced-motion fallbacks keep it accessible.
 */
export function LandingLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Return to landing page"
      title="Home"
      className={`group fixed left-5 top-5 z-50 grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white/12 bg-surface/70 text-ink-muted shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md transition duration-200 ease-out hover:border-brand/55 hover:text-ink hover:shadow-[0_0_0_4px_rgba(40,69,231,0.14),0_18px_46px_-12px_rgba(40,69,231,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-95 motion-reduce:transition-none ${className}`}
    >
      {/* top-lit brand sheen, revealed on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(40,69,231,0.45),transparent_72%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="relative h-5 w-5 transition-transform duration-200 ease-out group-hover:-translate-y-[2px] motion-reduce:transform-none"
        fill="none"
      >
        <path
          d="M4.5 10.5 12 4l7.5 6.5M6.75 9.25V20h10.5V9.25M9.75 20v-5.75h4.5V20"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
