import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { ContentEditor } from '@/components/admin/ContentEditor';

export const metadata: Metadata = {
  title: 'New Page — Admin',
  robots: { index: false, follow: false },
};

export default async function NewPageRoute() {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/admin/pages"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition hover:text-fg"
        >
          <span aria-hidden>&larr; </span>Pages
        </Link>

        {/* Header */}
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">New page</h1>
        </div>

        {/* Editor */}
        <div className="mt-10">
          <ContentEditor initial={null} kind="page" />
        </div>
      </div>
    </main>
  );
}
