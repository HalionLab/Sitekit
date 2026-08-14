import { createServiceRoleClient } from './supabase';
import { testEnv } from './env';

/**
 * Draft post fixture for draft-preview tests. Created (idempotently) by
 * global-setup via service-role upsert. It is never published, so it can never
 * appear on the public site; it exists so /api/draft/enable has something to
 * preview.
 */
export const DRAFT_FIXTURE = {
  kind: 'post' as const,
  slug: 'e2e-test-draft',
  title: 'E2E Test Draft (never published)',
  excerpt: 'Playwright draft-preview test fixture. Do not publish.',
  body_markdown:
    '## Draft fixture\n\nThis row exists only for Playwright draft-preview tests. Do not publish. If deleted, global-setup recreates it on the next test run.',
  status: 'draft' as const,
};

/**
 * Test lead emails are recognizable (playwright-e2e+<timestamp>@) so they can
 * be filtered in the dashboard and are deleted by global teardown.
 */
const TEST_LEAD_EMAIL_LIKE = 'playwright-e2e+%@example.com';

export function makeTestLeadEmail(): string {
  return `playwright-e2e+${Date.now()}@example.com`;
}

export async function ensureDraftFixture(): Promise<void> {
  const sb = createServiceRoleClient();
  const { error } = await sb
    .from('content_items')
    .upsert(DRAFT_FIXTURE, { onConflict: 'kind,slug' });
  if (error) throw new Error(`ensureDraftFixture failed: ${error.message}`);
}

export async function cleanupTestLeads(): Promise<number> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from('leads')
    .delete()
    .like('email', TEST_LEAD_EMAIL_LIKE)
    .select('id');
  if (error) throw new Error(`cleanupTestLeads failed: ${error.message}`);
  return data?.length ?? 0;
}

/** Service-role lookup used to assert whether a submit actually inserted a row. */
export async function findLeadsByEmail(email: string): Promise<{ id: string; source: string }[]> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb.from('leads').select('id, source').eq('email', email);
  if (error) throw new Error(`findLeadsByEmail failed: ${error.message}`);
  return (data ?? []) as { id: string; source: string }[];
}

// ---------------------------------------------------------------------------
// Admin posts e2e helpers
// ---------------------------------------------------------------------------

/**
 * Admin-posts test slugs use this prefix so they are unmistakably recognizable
 * as test data and can be safety-net-deleted by global teardown and cleanupTestContent.
 * Drafts are never publicly visible (RLS gates on status='published'), so rows
 * with this prefix cannot appear on the live site even while tests are running.
 */
const TEST_POST_SLUG_PREFIX = 'e2e-test-admin-';

/** Returns a unique slug for a new test post, e.g. "e2e-test-admin-1717000000000". */
export function makeTestPostSlug(): string {
  return `${TEST_POST_SLUG_PREFIX}${Date.now()}`;
}

/**
 * Admin-pages test slugs use a distinct prefix from posts so page-kind cleanup
 * can target only page rows and never collide with post test data. Page drafts
 * are likewise never publicly visible (RLS gates on status='published').
 */
const TEST_PAGE_SLUG_PREFIX = 'e2e-test-page-';

/** Returns a unique slug for a new test page, e.g. "e2e-test-page-1717000000000". */
export function makeTestPageSlug(): string {
  return `${TEST_PAGE_SLUG_PREFIX}${Date.now()}`;
}

/**
 * Service-role lookup: find a content_items row by slug. Returns the row or
 * null if not found. Used in tests to assert DB state after UI actions.
 */
export async function findContentBySlug(
  slug: string,
): Promise<{ id: string; slug: string; title: string; status: string } | null> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from('content_items')
    .select('id, slug, title, status')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`findContentBySlug failed: ${error.message}`);
  return data as { id: string; slug: string; title: string; status: string } | null;
}

/**
 * Safety-net cleanup: deletes all content_items rows whose slug starts with
 * "e2e-test-admin-". Called by global teardown and also available for per-test
 * cleanup.
 *
 * NOTE: The delete predicate is:
 *   .eq('kind', 'post').like('slug', 'e2e-test-admin-%')
 *
 * This is intentionally conservative — it only removes post-kind rows with the
 * exact test prefix and will never touch production content.
 */
export async function cleanupTestContent(): Promise<number> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from('content_items')
    .delete()
    .eq('kind', 'post')
    .like('slug', 'e2e-test-admin-%')
    .select('id');
  if (error) throw new Error(`cleanupTestContent failed: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Safety-net cleanup for admin-pages tests: deletes all content_items rows whose
 * slug starts with "e2e-test-page-". Mirrors cleanupTestContent but scoped to
 * page-kind rows. Called by global teardown and available for per-test cleanup.
 *
 * The delete predicate is intentionally conservative:
 *   .eq('kind', 'page').like('slug', 'e2e-test-page-%')
 * so it only removes page-kind rows with the exact test prefix and will never
 * touch production content.
 */
export async function cleanupTestPages(): Promise<number> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from('content_items')
    .delete()
    .eq('kind', 'page')
    .like('slug', 'e2e-test-page-%')
    .select('id');
  if (error) throw new Error(`cleanupTestPages failed: ${error.message}`);
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Upload / storage helpers
// ---------------------------------------------------------------------------

/**
 * Extended content row lookup that includes image-related columns. Used by
 * upload tests to read back cover_image_path and body_markdown after saving.
 *
 * Returns null if the row does not exist.
 */
export async function getContentRowBySlug(slug: string): Promise<{
  id: string;
  slug: string;
  title: string;
  status: string;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  body_markdown: string | null;
} | null> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from('content_items')
    .select('id, slug, title, status, cover_image_path, cover_image_alt, body_markdown')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`getContentRowBySlug failed: ${error.message}`);
  return data as {
    id: string;
    slug: string;
    title: string;
    status: string;
    cover_image_path: string | null;
    cover_image_alt: string | null;
    body_markdown: string | null;
  } | null;
}

/**
 * Remove specific Storage objects from the `media` bucket by their exact keys.
 *
 * SAFETY CONTRACT:
 *   - This function ONLY removes the exact keys passed in the array — it NEVER
 *     calls storage.list() or performs any broad scan. Test specs are responsible
 *     for tracking every key they cause to be uploaded and passing that explicit
 *     list here. This design prevents accidental deletion of real production images.
 *   - If keys is empty, this is a no-op (returns 0) — no storage call is made.
 *
 * @param keys - Bare storage keys (e.g. "uploads/1717000000000-my-image.png").
 *               Must be the paths as returned by the upload action, without a
 *               leading slash and without the bucket name prefix.
 * @returns The number of keys removed (equals keys.length on success).
 * @throws If the Supabase storage call returns an error.
 */
export async function removeStorageObjects(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const sb = createServiceRoleClient();
  const { error } = await sb.storage.from('media').remove(keys);
  if (error) throw new Error(`removeStorageObjects failed: ${error.message}`);
  return keys.length;
}

/**
 * Build the public URL for a storage key in the `media` bucket.
 * Uses NEXT_PUBLIC_SUPABASE_URL from the test environment (same as testEnv.supabaseUrl()).
 */
export function mediaPublicUrl(key: string): string {
  const base = testEnv.supabaseUrl().replace(/\/$/, '');
  return `${base}/storage/v1/object/public/media/${key}`;
}
