import type { Metadata } from 'next';
import { contentSource } from '@/lib/content';
import { site } from '@/site.config';
import { notFoundUnless, features } from '@/lib/config/features';
import { SITE, sharedOpenGraph } from '@/lib/seo/site';
import { PostCard } from '@/components/blog/PostCard';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import { DisplayGradient } from '@/components/ui/DisplayGradient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog',
  description: site.description,
  alternates: { canonical: '/blog' },
  openGraph: {
    ...sharedOpenGraph,
    type: 'website',
    url: '/blog',
    title: `Blog -- ${SITE.name}`,
    description: site.description,
  },
};

export default async function BlogIndexPage() {
  notFoundUnless(features.blog);

  const posts = await contentSource.listPosts();

  return (
    <main className="bg-surface">
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <EyebrowLabel>From the blog</EyebrowLabel>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] tracking-tight">
          Notes and advice <DisplayGradient>from our team.</DisplayGradient>
        </h1>

        {posts.length === 0 ? (
          <p className="mt-16 text-fg/70">No posts yet. Check back soon.</p>
        ) : (
          <div className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
