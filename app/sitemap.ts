import type { MetadataRoute } from 'next';
import { contentSource } from '@/lib/content';
import { RESERVED_SLUGS } from '@/lib/content/reserved-slugs';
import { siteOrigin } from '@/lib/seo/site';
import { site } from '@/site.config';

/**
 * Regenerate hourly (matches the blog's ISR cadence) so newly published
 * content shows up without a redeploy. In Supabase mode this reads via the
 * cookieless client, so the route stays statically generatable.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const content = await contentSource.sitemapEntries();

  const entries: MetadataRoute.Sitemap = [{ url: `${origin}/`, changeFrequency: 'weekly', priority: 1 }];

  if (site.features.blog) {
    // Blog index changes whenever its newest post changes.
    const postDates = content
      .filter(item => item.kind === 'post')
      .map(item => new Date(item.updatedAt).getTime());
    const newestPost = postDates.length > 0 ? new Date(Math.max(...postDates)) : undefined;
    entries.push({ url: `${origin}/blog`, lastModified: newestPost, changeFrequency: 'weekly', priority: 0.8 });
  }

  if (site.features.cms) {
    entries.push({ url: `${origin}/login`, changeFrequency: 'yearly', priority: 0.1 });
  }

  for (const item of content) {
    if (item.kind === 'post') {
      if (!site.features.blog) continue;
      entries.push({
        url: `${origin}/blog/${item.slug}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
      continue;
    }
    // Reserved slugs can't render under /[slug]; never list them. (/admin,
    // /api/*, and /auth/* are excluded by construction -- they're simply
    // never added.)
    if (RESERVED_SLUGS.has(item.slug)) continue;
    entries.push({
      url: `${origin}/${item.slug}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
