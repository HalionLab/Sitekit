import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';

export type ContentKind = 'post' | 'page';
export type ContentStatus = 'draft' | 'published';

export interface ContentItem {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  body_markdown: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_path: string | null;
  jsonld_overrides: Record<string, unknown>;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPublishedPosts(): Promise<ContentItem[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', 'post')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`getPublishedPosts: ${error.message}`);
  return (data ?? []) as ContentItem[];
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('slug')
    .eq('kind', 'post')
    .eq('status', 'published');
  if (error) throw new Error(`getPublishedPostSlugs: ${error.message}`);
  return (data ?? []).map(r => r.slug as string);
}

export async function getPostBySlug(slug: string): Promise<ContentItem | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', 'post')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(`getPostBySlug: ${error.message}`);
  return (data as ContentItem | null) ?? null;
}

/**
 * Admin-only: include drafts. Fetches via the service-role client because RLS
 * exposes only published rows, even to authenticated sessions. Caller MUST
 * have already verified admin status (requireAdmin / isRequestFromAdmin) --
 * this function does no auth check of its own.
 */
export async function getPostBySlugIncludingDrafts(slug: string): Promise<ContentItem | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', 'post')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`getPostBySlugIncludingDrafts: ${error.message}`);
  return (data as ContentItem | null) ?? null;
}

export async function getPublishedPageSlugs(): Promise<string[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('slug')
    .eq('kind', 'page')
    .eq('status', 'published');
  if (error) throw new Error(`getPublishedPageSlugs: ${error.message}`);
  return (data ?? []).map(r => r.slug as string);
}

/**
 * Sitemap-only projection: kind + slug for URL construction, updated_at for
 * <lastmod>. Published rows of both kinds in one query, via the cookieless
 * client so the sitemap route stays statically generatable.
 */
export interface SitemapEntry {
  kind: ContentKind;
  slug: string;
  updated_at: string;
}

export async function getPublishedContentForSitemap(): Promise<SitemapEntry[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('kind, slug, updated_at')
    .eq('status', 'published');
  if (error) throw new Error(`getPublishedContentForSitemap: ${error.message}`);
  return (data ?? []) as SitemapEntry[];
}

export async function getPageBySlug(slug: string): Promise<ContentItem | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', 'page')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(`getPageBySlug: ${error.message}`);
  return (data as ContentItem | null) ?? null;
}

/**
 * Admin-only: include drafts. Same service-role contract as
 * getPostBySlugIncludingDrafts -- caller MUST have verified admin status.
 */
export async function getPageBySlugIncludingDrafts(slug: string): Promise<ContentItem | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', 'page')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`getPageBySlugIncludingDrafts: ${error.message}`);
  return (data as ContentItem | null) ?? null;
}

/**
 * Admin-only: ALL rows of the given kind (drafts + published), ordered by
 * updated_at desc. Uses the service-role client to bypass RLS. Caller MUST
 * have already verified admin status.
 */
export async function getAllContentForAdmin(kind: ContentKind): Promise<ContentItem[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('kind', kind)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`getAllContentForAdmin: ${error.message}`);
  return (data ?? []) as ContentItem[];
}

/**
 * Admin-only: single row by id (any status). Uses the service-role client to
 * bypass RLS. Caller MUST have already verified admin status. Returns null on
 * not-found and on malformed-uuid errors (does not throw in those cases).
 */
export async function getContentById(id: string): Promise<ContentItem | null> {
  // Supabase throws a PostgrestError with code "22P02" (invalid_text_representation)
  // when the uuid is malformed; catch that case and return null instead of throwing.
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    // 22P02 = invalid_text_representation (malformed UUID)
    if (error.code === '22P02') return null;
    throw new Error(`getContentById: ${error.message}`);
  }
  return (data as ContentItem | null) ?? null;
}
