export interface Post {
  slug: string;
  title: string;
  bodyMarkdown: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null; // ISO string
  updatedAt: string; // ISO string
}

// Pages share the Post shape; which one a caller gets is implied by which
// ContentSource method they called (posts vs. pages), not by a discriminant
// field on the object itself.
export type Page = Post;

export interface SitemapEntry {
  kind: 'post' | 'page';
  slug: string;
  updatedAt: string;
}

export interface ContentSource {
  listPosts(): Promise<Post[]>; // published only, newest first
  getPost(slug: string): Promise<Post | null>; // published only
  getPostIncludingDrafts(slug: string): Promise<Post | null>;
  listPageSlugs(): Promise<string[]>; // published pages
  getPage(slug: string): Promise<Page | null>;
  getPageIncludingDrafts(slug: string): Promise<Page | null>;
  sitemapEntries(): Promise<SitemapEntry[]>;
  // Optional: per-item JSON-LD shallow-override map. `jsonld_overrides` is a
  // CMS-only concept (it isn't part of the neutral Post/Page shape), so only
  // the Supabase source implements this; file-mode callers use
  // `contentSource.getJsonldOverrides?.(slug) ?? {}`.
  getJsonldOverrides?(slug: string): Promise<Record<string, unknown>>;
}
