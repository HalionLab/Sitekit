import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { getAllDownloadItems } from '@/lib/downloads/queries';
import { DownloadUploadForm } from '@/components/admin/DownloadUploadForm';
import { DownloadActions } from '@/components/admin/DownloadActions';

export const metadata: Metadata = {
  title: 'Downloads — Admin',
  robots: { index: false, follow: false },
};

// Reads cookies (auth); always render at request time.
export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AdminDownloadsPage() {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  const items = await getAllDownloadItems();
  const current = items.find((i) => i.is_current) ?? null;

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition hover:text-fg"
        >
          <span aria-hidden>&larr; </span>Admin
        </Link>

        {/* Header */}
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Downloads</h1>
        </div>

        {/* Current-item status — the failure mode is uploading a new item but
            forgetting to mark it current, silently serving the old one. Make
            "what's live" unmistakable, and shout when nothing is. */}
        {current ? (
          <div className="mt-8 rounded-2xl border border-accent-alt/30 bg-accent-alt/8 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-alt">
              Currently live
            </p>
            <p className="mt-1 font-display text-lg text-fg">{current.label}</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/8 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              No current download
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg/75">
              Nothing is live. The landing page and signups have no download to
              serve until you mark an item current below.
            </p>
          </div>
        )}

        {/* Upload */}
        <div className="mt-8">
          <DownloadUploadForm />
        </div>

        {/* List */}
        <div className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg/45">
            All downloads
          </p>
          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-fg/10 bg-white px-6 py-12 text-center">
              <p className="text-sm text-fg/55">No downloads yet.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-fg/8 rounded-2xl border border-fg/10 bg-white">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-fg">{item.label}</span>
                      {item.is_current && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-accent-alt/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-alt">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-fg/40">
                      Added {formatDate(item.created_at)}
                    </p>
                  </div>
                  <DownloadActions
                    id={item.id}
                    label={item.label}
                    isCurrent={item.is_current}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
