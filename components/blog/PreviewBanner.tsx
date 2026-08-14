import Link from 'next/link';

/**
 * Fixed banner shown at the top of the viewport while Draft Mode is active.
 * The disable link must keep prefetch={false}: a hover prefetch would hit
 * /api/draft/disable and silently clear the bypass cookie.
 */
export function PreviewBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 bg-surface-inverse px-4 py-2.5 text-fg-inverse">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
        Previewing draft
      </span>
      <Link
        href="/api/draft/disable"
        prefetch={false}
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent underline-offset-4 transition hover:underline"
      >
        Disable preview
      </Link>
    </div>
  );
}
