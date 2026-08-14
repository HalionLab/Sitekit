/* eslint-disable @next/next/no-img-element -- cover images are remote Supabase
   Storage URLs with unknown dimensions; next/image doesn't fit this content. */
import Link from 'next/link';
import type { Post } from '@/lib/content/types';
import { getReadingTimeMinutes } from '@/lib/content/reading-time';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PostCard({ post }: { post: Post }) {
  const published = post.publishedAt ? formatDate(post.publishedAt) : null;
  const minutes = getReadingTimeMinutes(post.bodyMarkdown);

  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.coverImage && (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface-inverse/5">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt ?? ''}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            {published ? `${published} · ` : ''}
            {minutes} min read
          </p>
          <h2 className="mt-2 font-display text-2xl text-fg transition group-hover:text-accent">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 leading-relaxed text-fg/70">{post.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
