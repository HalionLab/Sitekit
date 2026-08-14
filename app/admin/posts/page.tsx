import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { getAllContentForAdmin } from '@/lib/content/queries';

export const metadata: Metadata = {
  title: 'Posts — Admin',
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AdminPostsPage() {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  const posts = await getAllContentForAdmin('post');

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
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Admin
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">Posts</h1>
          </div>
          <Link
            href="/admin/posts/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-105"
          >
            New post
          </Link>
        </div>

        {/* List */}
        <div className="mt-10">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-fg/10 bg-white px-6 py-12 text-center">
              <p className="text-sm text-fg/55">No posts yet.</p>
              <Link
                href="/admin/posts/new"
                className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-105"
              >
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-fg/8 rounded-2xl border border-fg/10 bg-white">
              {posts.map((post) => {
                const isDraft = post.status === 'draft';
                return (
                  <div
                    key={post.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    {/* Left: title + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="truncate font-medium text-fg transition hover:text-accent"
                        >
                          {post.title}
                        </Link>
                        <span
                          className={[
                            'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]',
                            isDraft
                              ? 'bg-surface-inverse/8 text-fg/55'
                              : 'bg-accent-alt/15 text-accent-alt',
                          ].join(' ')}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-fg/40">
                        {post.slug}
                      </p>
                      <p className="mt-1 text-xs text-fg/40">
                        Updated {formatDate(post.updated_at)}
                        {post.published_at
                          ? ` · Published ${formatDate(post.published_at)}`
                          : ''}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-xs text-fg/55 transition hover:text-fg"
                      >
                        Edit
                      </Link>
                      {isDraft && (
                        <Link
                          href={`/api/draft/enable?slug=${encodeURIComponent(post.slug)}&type=post`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent transition hover:text-fg"
                        >
                          Preview
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
