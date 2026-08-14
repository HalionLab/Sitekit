import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { signOut } from './actions';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/**
 * Minimal admin landing page. Its job in Phase 5 is to prove the auth loop:
 * magic link -> session -> allowlist gate. Authoring UI comes later.
 *
 * Reads cookies, so this route is always dynamically rendered.
 */
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm rounded-2xl border border-fg/15 bg-white p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Admin
        </p>
        <h1 className="mt-3 font-display text-2xl tracking-tight">
          Signed in as {user!.email}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-fg/70">
          Write and publish posts and pages, preview drafts, and review or
          export captured leads.
        </p>
        <nav className="mt-6 space-y-3">
          <Link
            href="/admin/posts"
            className="flex items-center justify-between rounded-xl border border-fg/15 px-4 py-3 text-sm font-medium text-fg transition hover:border-fg/30 hover:bg-surface-inverse/3"
          >
            Posts
            <span aria-hidden className="text-fg/30">
              &rarr;
            </span>
          </Link>
          <Link
            href="/admin/pages"
            className="flex items-center justify-between rounded-xl border border-fg/15 px-4 py-3 text-sm font-medium text-fg transition hover:border-fg/30 hover:bg-surface-inverse/3"
          >
            Pages
            <span aria-hidden className="text-fg/30">
              &rarr;
            </span>
          </Link>
          <Link
            href="/admin/leads"
            className="flex items-center justify-between rounded-xl border border-fg/15 px-4 py-3 text-sm font-medium text-fg transition hover:border-fg/30 hover:bg-surface-inverse/3"
          >
            Leads
            <span aria-hidden className="text-fg/30">
              &rarr;
            </span>
          </Link>
          <Link
            href="/admin/downloads"
            className="flex items-start justify-between gap-4 rounded-xl border border-fg/15 px-4 py-3 text-sm font-medium text-fg transition hover:border-fg/30 hover:bg-surface-inverse/3"
          >
            <span>
              Downloads
              <span className="mt-0.5 block text-xs font-normal text-fg/55">
                Offer a PDF (guide, menu, price sheet) in exchange for an email.
              </span>
            </span>
            <span aria-hidden className="mt-0.5 shrink-0 text-fg/30">
              &rarr;
            </span>
          </Link>
        </nav>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-full border border-fg/20 px-5 py-3 text-sm font-medium text-fg transition hover:border-fg/40"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
