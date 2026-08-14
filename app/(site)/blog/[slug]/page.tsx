/* eslint-disable @next/next/no-img-element -- cover images may be remote
   Supabase Storage URLs with unknown dimensions; next/image doesn't fit this
   content. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { isRequestFromAdmin } from '@/lib/admin/auth';
import { contentSource, type Post } from '@/lib/content';
import { getReadingTimeMinutes } from '@/lib/content/reading-time';
import { renderMarkdown } from '@/lib/markdown/render';
import { SITE, sharedOpenGraph, absoluteUrl } from '@/lib/seo/site';
import { site } from '@/site.config';
import { notFoundUnless, features } from '@/lib/config/features';
import { JsonLd } from '@/components/seo/JsonLd';
import { PreviewBanner } from '@/components/blog/PreviewBanner';

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await contentSource.listPosts();
  return posts.map(post => ({ slug: post.slug }));
}

/**
 * Three-gate draft access: the Draft Mode bypass cookie, the `cms` feature
 * flag, AND a verified admin session must all be present; any gate failing
 * keeps the request on the published-only path. The flag check short-circuits
 * before touching auth in file mode (no CMS, no admin sessions to check); the
 * admin check (a cookie read) is only reached when Draft Mode is already
 * enabled, so static prerendering of the published path is unaffected.
 */
async function loadPost(slug: string): Promise<{ post: Post | null; isPreview: boolean }> {
  const { isEnabled } = await draftMode();
  if (isEnabled && site.features.cms && (await isRequestFromAdmin())) {
    return { post: await contentSource.getPostIncludingDrafts(slug), isPreview: true };
  }
  return { post: await contentSource.getPost(slug), isPreview: false };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { post, isPreview } = await loadPost(slug);
  if (!post) return {};

  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const ogImage = post.ogImage ?? post.coverImage;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    // Draft previews must never be indexed.
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      ...sharedOpenGraph,
      type: 'article',
      url: `/blog/${post.slug}`,
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: ogImage ? [{ url: ogImage, alt: post.coverImageAlt ?? title }] : sharedOpenGraph.images,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  notFoundUnless(features.blog);

  const { slug } = await params;
  const { post, isPreview } = await loadPost(slug);
  if (!post) notFound();

  const published = post.publishedAt ? formatDate(post.publishedAt) : null;
  const minutes = getReadingTimeMinutes(post.bodyMarkdown);
  const jsonldOverrides = await contentSource.getJsonldOverrides?.(slug) ?? {};

  // BlogPosting schema; per-post jsonld_overrides from the CMS shallow-override
  // the generated fields.
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: { '@type': 'Organization', name: SITE.name },
    publisher: { '@type': 'Organization', name: SITE.name },
    ...jsonldOverrides,
  };

  return (
    <main className="bg-surface">
      <JsonLd data={blogPostingSchema} />
      {isPreview && <PreviewBanner />}
      <article className="mx-auto max-w-3xl px-6 py-24 lg:px-0">
        <Link
          href="/blog"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition hover:text-fg"
        >
          <span aria-hidden>&larr; </span>Back to blog
        </Link>

        <header className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            {published ? `${published} · ` : ''}
            {minutes} min read
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-fg/70">{post.excerpt}</p>
          )}
        </header>

        {post.coverImage && (
          <div className="mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-inverse/5">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt ?? ''}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="prose-blog mt-12">{renderMarkdown(post.bodyMarkdown)}</div>
      </article>
    </main>
  );
}
