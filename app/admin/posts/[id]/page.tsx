import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { getContentById } from '@/lib/content/queries';
import { ContentEditor } from '@/components/admin/ContentEditor';

export const metadata: Metadata = {
  title: 'Edit Post — Admin',
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  const { id } = await params;
  const post = await getContentById(id);
  // Guard the kind: this route renders a post editor and submits kind="post",
  // so opening a page row here would silently convert it to a post on save.
  // getContentById is kind-agnostic by design (pages will reuse it), so the
  // route enforces the kind itself.
  if (!post || post.kind !== 'post') notFound();

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/admin/posts"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition hover:text-fg"
        >
          <span aria-hidden>&larr; </span>Posts
        </Link>

        {/* Header */}
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">{post.title}</h1>
        </div>

        {/* Editor */}
        <div className="mt-10">
          <ContentEditor initial={post} kind="post" />
        </div>
      </div>
    </main>
  );
}
