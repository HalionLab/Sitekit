import { RESERVED_SLUGS } from '@/lib/content/reserved-slugs';

/**
 * Slug format: same pattern enforced by the DB CHECK constraint `slug_format`
 * in supabase/migrations/0001_init.sql. Keeping it here as a named constant
 * means the server action and client SlugField component both reference one
 * definition rather than two independent regexes that could drift.
 */
const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ContentKind = 'post' | 'page';
export type ContentIntent = 'draft' | 'publish' | 'unpublish';

/**
 * Typed, validated payload produced by `validateContentInput`. Field names
 * are snake_case to match the `content_items` table columns exactly, so this
 * object can be spread into a Supabase insert/update without remapping.
 */
export interface ContentInput {
  /** null means "create new"; non-null means "update existing row". */
  id: string | null;
  kind: ContentKind;
  title: string;
  slug: string;
  excerpt: string | null;
  body_markdown: string;
  meta_title: string | null;
  meta_description: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  intent: ContentIntent;
}

export type ContentInputResult =
  | { ok: true; data: ContentInput }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// deriveSlug
// ---------------------------------------------------------------------------

/**
 * Converts an arbitrary title string into a URL-safe kebab-case slug.
 *
 * Algorithm:
 *   1. Lowercase the whole string.
 *   2. Replace every run of one or more non-[a-z0-9] characters with a single
 *      hyphen (this handles spaces, punctuation, and non-ASCII Unicode alike).
 *   3. Strip any leading or trailing hyphens produced by step 2.
 *
 * Returns '' for empty input or strings that contain no alphanumeric ASCII
 * characters (e.g. pure punctuation or pure emoji). The empty-string case is
 * intentional: callers (e.g. SlugField) can detect it and show a placeholder
 * rather than writing an invalid slug to state.
 */
export function deriveSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// validateContentInput
// ---------------------------------------------------------------------------

/**
 * Validates the raw FormData submitted by the content editor.
 *
 * Returns a discriminated union so callers handle errors without try/catch:
 *   { ok: true,  data: ContentInput }   — ready to pass to the DB layer
 *   { ok: false, error: string }        — first human-readable validation error
 *
 * Validation rules mirror the DB CHECK constraints in 0001_init.sql so users
 * receive a friendly message before the insert/update ever reaches Supabase.
 * The reserved-slug check reuses RESERVED_SLUGS from lib/content/reserved-slugs.ts
 * so the routing guard and this validator can never drift apart.
 */
export function validateContentInput(formData: FormData): ContentInputResult {
  const get = (key: string) => (formData.get(key) as string | null) ?? '';

  const rawId           = get('id').trim();
  const rawKind         = get('kind');
  const rawTitle        = get('title');
  const rawSlug         = get('slug').trim();
  const rawExcerpt      = get('excerpt').trim();
  const rawBodyMarkdown = get('body_markdown');
  const rawMetaTitle    = get('meta_title').trim();
  const rawMetaDesc     = get('meta_description').trim();
  const rawCoverPath    = get('cover_image_path').trim();
  const rawCoverAlt     = get('cover_image_alt').trim();
  const rawIntent       = get('intent');

  // -- title ----------------------------------------------------------------
  if (!rawTitle.trim()) {
    return { ok: false, error: 'Title is required.' };
  }

  // -- slug: format ---------------------------------------------------------
  if (!SLUG_FORMAT.test(rawSlug)) {
    return {
      ok: false,
      error:
        'Slug must be lowercase letters, numbers, and hyphens only, with no ' +
        'leading, trailing, or consecutive hyphens (e.g. "my-post-2026").',
    };
  }

  // -- slug: reserved -------------------------------------------------------
  if (RESERVED_SLUGS.has(rawSlug)) {
    return {
      ok: false,
      error: `"${rawSlug}" is a reserved slug and cannot be used for content.`,
    };
  }

  // -- kind -----------------------------------------------------------------
  if (rawKind !== 'post' && rawKind !== 'page') {
    return { ok: false, error: `Invalid kind "${rawKind}". Must be "post" or "page".` };
  }

  // -- intent ---------------------------------------------------------------
  if (rawIntent !== 'draft' && rawIntent !== 'publish' && rawIntent !== 'unpublish') {
    return {
      ok: false,
      error: `Invalid intent "${rawIntent}". Must be "draft", "publish", or "unpublish".`,
    };
  }

  // -- cover image requires alt (mirrors DB CHECK cover_image_requires_alt) -
  if (rawCoverPath && !rawCoverAlt) {
    return {
      ok: false,
      error: 'Cover image alt text is required when a cover image is set.',
    };
  }

  // -- normalise optional fields to null ------------------------------------
  const nullable = (s: string) => (s === '' ? null : s);

  return {
    ok: true,
    data: {
      id:               rawId === '' ? null : rawId,
      kind:             rawKind,
      title:            rawTitle.trim(),
      slug:             rawSlug,
      excerpt:          nullable(rawExcerpt),
      body_markdown:    rawBodyMarkdown,
      meta_title:       nullable(rawMetaTitle),
      meta_description: nullable(rawMetaDesc),
      cover_image_path: nullable(rawCoverPath),
      cover_image_alt:  nullable(rawCoverAlt),
      intent:           rawIntent,
    },
  };
}
