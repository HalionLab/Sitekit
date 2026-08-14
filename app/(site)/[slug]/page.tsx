import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { isRequestFromAdmin } from '@/lib/admin/auth';
import { contentSource, type Page } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown/render';
import { sharedOpenGraph, absoluteUrl } from '@/lib/seo/site';
import { site } from '@/site.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { PreviewBanner } from '@/components/blog/PreviewBanner';
import { RESERVED_SLUGS } from '@/lib/content/reserved-slugs';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await contentSource.listPageSlugs();
  return slugs.filter(slug => !RESERVED_SLUGS.has(slug)).map(slug => ({ slug }));
}

/**
 * Three-gate draft access: the Draft Mode bypass cookie, the `cms` feature
 * flag, AND a verified admin session must all be present; any gate failing
 * keeps the request on the published-only path. The flag check short-circuits
 * before touching auth in file mode (no CMS, no admin sessions to check); the
 * admin check (a cookie read) is only reached when Draft Mode is already
 * enabled, so static prerendering of the published path is unaffected.
 */
async function loadPage(slug: string): Promise<{ page: Page | null; isPreview: boolean }> {
  const { isEnabled } = await draftMode();
  if (isEnabled && site.features.cms && (await isRequestFromAdmin())) {
    return { page: await contentSource.getPageIncludingDrafts(slug), isPreview: true };
  }
  return { page: await contentSource.getPage(slug), isPreview: false };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};
  const { page, isPreview } = await loadPage(slug);
  if (!page) return {};

  const title = page.metaTitle ?? page.title;
  const description = page.metaDescription ?? page.excerpt ?? undefined;
  const ogImage = page.ogImage ?? page.coverImage;

  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    // Draft previews must never be indexed.
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      ...sharedOpenGraph,
      type: 'website',
      url: `/${page.slug}`,
      title,
      description,
      images: ogImage ? [{ url: ogImage, alt: page.coverImageAlt ?? title }] : sharedOpenGraph.images,
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) notFound();
  const { page, isPreview } = await loadPage(slug);
  if (!page) notFound();

  const jsonldOverrides = (await contentSource.getJsonldOverrides?.(slug)) ?? {};

  // Minimal WebPage schema; per-page jsonld_overrides from the CMS
  // shallow-override the generated fields.
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.excerpt ?? undefined,
    url: absoluteUrl(`/${page.slug}`),
    ...jsonldOverrides,
  };

  return (
    <main className="bg-surface">
      <JsonLd data={webPageSchema} />
      {isPreview && <PreviewBanner />}
      <article className="mx-auto max-w-3xl px-6 py-24 lg:px-0">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
          {page.title}
        </h1>
        <div className="prose-blog mt-12">{renderMarkdown(page.bodyMarkdown)}</div>
      </article>
    </main>
  );
}
