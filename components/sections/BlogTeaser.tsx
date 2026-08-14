import Link from 'next/link';
import { site } from '@/site.config';
import { contentSource } from '@/lib/content';
import { PostCard } from '@/components/blog/PostCard';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { BlogTeaserCopy } from '@/lib/config/types';

export async function BlogTeaser({ copy }: { copy: BlogTeaserCopy }) {
  // Defensive: config validation already blocks `blogTeaser` from `site.sections`
  // when `features.blog` is off, but this component may also be rendered
  // standalone (e.g. a demo/preview route), so guard here too.
  if (!site.features.blog) return null;

  const posts = (await contentSource.listPosts()).slice(0, copy.limit ?? 3);
  if (posts.length === 0) return null;

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
            <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
              {copy.heading}{' '}
              {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
            </h2>
          </div>
          <Link href="/blog" className="text-accent font-medium hover:text-accent-alt shrink-0">
            View all posts →
          </Link>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
