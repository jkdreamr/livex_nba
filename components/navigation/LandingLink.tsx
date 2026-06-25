import Link from 'next/link';

export function LandingLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Return to landing page"
      title="Landing page"
      className={`fixed left-5 top-5 z-50 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/75 text-ink shadow-[0_12px_40px_rgba(0,0,0,0.32)] backdrop-blur transition hover:border-ink-muted hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M4.5 10.5 12 4l7.5 6.5M6.75 9.25V20h10.5V9.25M9.75 20v-5.75h4.5V20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
