'use client';

import Link from 'next/link';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight text-fg">
          Something went wrong
        </h1>
        <p className="mt-4 text-fg-muted">Try again, or head back home.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-contrast transition hover:brightness-105"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border-token px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-fg transition hover:bg-surface-inverse/5"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
