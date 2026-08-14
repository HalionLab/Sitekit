import 'server-only';
import {
  type ContentItem,
  getPageBySlug,
  getPageBySlugIncludingDrafts,
  getPostBySlug,
  getPostBySlugIncludingDrafts,
  getPublishedContentForSitemap,
  getPublishedPageSlugs,
  getPublishedPosts,
} from '@/lib/content/queries';
import { mediaUrl } from '@/lib/content/media';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ContentSource, Page, Post, SitemapEntry } from '@/lib/content/types';

/**
 * Map a Supabase row (snake_case, storage-relative paths) to the neutral,
 * storage-agnostic `Post`/`Page` shape. `coverImage`/`ogImage` are resolved
 * to full public URLs here via `mediaUrl()` so downstream components never
 * need to know they're reading from Supabase Storage. `jsonld_overrides` is
 * deliberately dropped -- it isn't part of the neutral type; see
 * `getJsonldOverrides` below.
 */
function toPost(item: ContentItem): Post {
  return {
    slug: item.slug,
    title: item.title,
    bodyMarkdown: item.body_markdown,
    excerpt: item.excerpt,
    coverImage: mediaUrl(item.cover_image_path),
    coverImageAlt: item.cover_image_alt,
    metaTitle: item.meta_title,
    metaDescription: item.meta_description,
    ogImage: mediaUrl(item.og_image_path),
    status: item.status,
    publishedAt: item.published_at,
    updatedAt: item.updated_at,
  };
}

/**
 * Supabase-backed `ContentSource`. Thin adapter over `lib/content/queries.ts`
 * (the existing `content_items` query layer) -- this module owns only the
 * `ContentItem` -> `Post` mapping and the `ContentSource` shape, not the
 * Supabase access itself.
 */
export function createSupabaseSource(): ContentSource {
  return {
    async listPosts(): Promise<Post[]> {
      const items = await getPublishedPosts();
      return items.map(toPost);
    },

    async getPost(slug: string): Promise<Post | null> {
      const item = await getPostBySlug(slug);
      return item ? toPost(item) : null;
    },

    async getPostIncludingDrafts(slug: string): Promise<Post | null> {
      const item = await getPostBySlugIncludingDrafts(slug);
      return item ? toPost(item) : null;
    },

    async listPageSlugs(): Promise<string[]> {
      return getPublishedPageSlugs();
    },

    async getPage(slug: string): Promise<Page | null> {
      const item = await getPageBySlug(slug);
      return item ? toPost(item) : null;
    },

    async getPageIncludingDrafts(slug: string): Promise<Page | null> {
      const item = await getPageBySlugIncludingDrafts(slug);
      return item ? toPost(item) : null;
    },

    async sitemapEntries(): Promise<SitemapEntry[]> {
      const entries = await getPublishedContentForSitemap();
      return entries.map(e => ({ kind: e.kind, slug: e.slug, updatedAt: e.updated_at }));
    },

    /**
     * Looks up the raw `jsonld_overrides` map directly (not via `toPost`,
     * since that field is deliberately excluded from the neutral `Post`
     * shape). Uses the service-role client so it resolves the same for both
     * published content and an admin's draft preview -- `jsonld_overrides`
     * carries no sensitive data, and the two-gate draft check already ran
     * before a caller reaches for this. Returns `{}` on any not-found/error
     * so a missing override map never breaks page render.
     */
    async getJsonldOverrides(slug: string): Promise<Record<string, unknown>> {
      const sb = createAdminClient();
      const { data, error } = await sb
        .from('content_items')
        .select('jsonld_overrides')
        .eq('slug', slug)
        .maybeSingle();
      if (error || !data) return {};
      return (data.jsonld_overrides as Record<string, unknown> | null) ?? {};
    },
  };
}
