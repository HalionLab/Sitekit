import { test, expect } from '@playwright/test';
import { signInAsAdmin } from './helpers/session';
import {
  makeTestPostSlug,
  findContentBySlug,
  cleanupTestContent,
} from './helpers/fixtures';
import { testEnv } from './helpers/env';

/**
 * E2E tests for the admin posts editor (/admin/posts).
 *
 * All tests in the draft-lifecycle group use injected admin sessions (no
 * magic-link email sent — see helpers/session.ts). The publish-flow group is
 * skipped by default; see the comment there for why.
 *
 * SAFETY: Every test that writes to content_items uses slugs prefixed
 * "e2e-test-admin-" and status='draft' (drafts are never publicly visible via
 * RLS). Per-test cleanup happens in try/finally; global teardown provides an
 * additional safety net.
 *
 * The dev server and local .env.local both point at the PRODUCTION Supabase
 * database. Run locally only with E2E_BASE_URL=http://localhost:3000:
 *   npx dotenv -e .env.local -- playwright test admin-posts --project=desktop-chrome
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

// ---------------------------------------------------------------------------
// Draft-lifecycle group — runs everywhere (incl. future prod runs)
// ---------------------------------------------------------------------------

test.describe('admin posts list page', () => {
  test('renders heading and New post button with an admin session', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);
    await page.goto('/admin/posts');

    await expect(page.getByRole('heading', { name: 'Posts', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New post' })).toBeVisible();
  });

  test('redirects to /login without a session', async ({ page }) => {
    await page.goto('/admin/posts');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible();
  });
});

/**
 * Create → Edit → Delete as a serial block so state flows naturally between
 * tests while still being independently reportable. cleanup() is idempotent
 * and runs in every afterEach to ensure the row is removed on any failure.
 */
test.describe.serial('admin posts draft lifecycle', () => {
  /**
   * Track the slug created by the "create" test so subsequent tests (edit,
   * delete) can find the row. A variable in outer scope is the idiomatic
   * Playwright way to share state within a serial describe block.
   */
  let createdSlug = '';

  test.afterAll(async () => {
    // Runs once after the whole serial block: removes the row if the delete
    // test never got to it (serial mode skips remaining tests after a failure,
    // so a mid-block failure leaves the row behind). No-op on the happy path.
    // Global teardown provides the final safety net.
    if (createdSlug) {
      const row = await findContentBySlug(createdSlug);
      if (row) {
        await cleanupTestContent();
      }
    }
  });

  test('create draft: fills form, saves, verifies list and DB', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    const slug = makeTestPostSlug();
    createdSlug = slug;

    // Derive the title that produces this slug (the slug field auto-derives from title)
    // We type a title that will derive to the slug format via deriveSlug().
    // makeTestPostSlug() returns "e2e-test-admin-<timestamp>" — the title
    // "E2E Test Admin <timestamp>" derives to that exact slug.
    const ts = slug.replace('e2e-test-admin-', '');
    const title = `E2E Test Admin ${ts}`;

    await page.goto('/admin/posts/new');
    await expect(page.getByRole('heading', { name: 'New post', level: 1 })).toBeVisible();

    // Fill title — slug field auto-derives
    await page.getByLabel('Title', { exact: true }).fill(title);

    // Verify the visible slug field reflects the derived slug
    await expect(page.locator('#slug-input')).toHaveValue(slug);

    // Fill body markdown
    await page.getByLabel('Body (Markdown)').fill('## Hello\n\nThis is an **e2e** test post.\n');

    // Save as draft → should redirect to /admin/posts
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/posts');

    // New post should appear in the list
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    // Status badge should be "draft"
    // The list renders a <span> with the status text next to the title link
    const postRow = page.getByRole('link', { name: title }).locator('..');
    await expect(postRow.getByText('draft')).toBeVisible();

    // DB assertion via service-role client
    const row = await findContentBySlug(slug);
    expect(row).not.toBeNull();
    expect(row?.status).toBe('draft');
    expect(row?.title).toBe(title);
  });

  test('edit draft: changes title, verifies list and DB', async ({
    page,
    context,
  }) => {
    // createdSlug is set by the create test (serial order guarantees it)
    expect(createdSlug).not.toBe('');

    await signInAsAdmin(context);

    // Find the row to get its DB id
    const row = await findContentBySlug(createdSlug);
    expect(row).not.toBeNull();

    // Navigate to the edit page directly by id
    await page.goto(`/admin/posts/${row!.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Change the title (append " — edited")
    const updatedTitle = `${row!.title} — edited`;
    await page.getByLabel('Title', { exact: true }).fill(updatedTitle);

    // Slug is locked on existing posts — we do NOT change it, so createdSlug stays valid
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/posts');

    // Updated title visible in list
    await expect(page.getByRole('link', { name: updatedTitle })).toBeVisible();

    // DB row updated
    const updated = await findContentBySlug(createdSlug);
    expect(updated?.title).toBe(updatedTitle);
    expect(updated?.status).toBe('draft');
  });

  test('delete draft: two-step confirm removes post from list and DB', async ({
    page,
    context,
  }) => {
    expect(createdSlug).not.toBe('');

    await signInAsAdmin(context);

    const row = await findContentBySlug(createdSlug);
    expect(row).not.toBeNull();

    await page.goto(`/admin/posts/${row!.id}`);

    // First click: "Delete post" → shows confirm state
    await page.getByRole('button', { name: 'Delete post' }).click();

    // Confirm button appears
    await expect(page.getByRole('button', { name: 'Yes, delete this post' })).toBeVisible();
    // Cancel button also appears (proves confirm UI is rendered)
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Second click: confirm delete → redirects to /admin/posts
    await page.getByRole('button', { name: 'Yes, delete this post' }).click();
    await page.waitForURL('**/admin/posts');

    // Post should NOT appear in the list
    await expect(page.getByRole('link', { name: row!.title })).not.toBeVisible();

    // DB row should be gone
    const deleted = await findContentBySlug(createdSlug);
    expect(deleted).toBeNull();

    // Clear slug so afterEach no-ops (row is already gone)
    createdSlug = '';
  });
});

test.describe('admin posts live preview', () => {
  test('markdown in body renders h2 and strong in the preview pane', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);
    await page.goto('/admin/posts/new');

    const bodyTextarea = page.getByLabel('Body (Markdown)');
    await bodyTextarea.fill('## Preview heading\n\nSome **bold text** here.');

    // Preview pane is the right-column div containing a "Preview" label.
    // The MarkdownPreview component has a 200ms debounce — wait for the render.
    const previewPane = page.locator('div').filter({ hasText: /^Preview/ }).last();

    // h2 rendered from ## heading
    await expect(previewPane.locator('h2')).toBeVisible({ timeout: 2000 });
    await expect(previewPane.locator('h2')).toContainText('Preview heading');

    // strong rendered from **bold text**
    await expect(previewPane.locator('strong')).toBeVisible();
    await expect(previewPane.locator('strong')).toContainText('bold text');
  });
});

// ---------------------------------------------------------------------------
// Publish-flow group — skipped unless ALL THREE conditions are true:
//   1. E2E_ALLOW_PUBLISH=1  (explicit opt-in)
//   2. E2E_BASE_URL resolves to localhost  (not targeting the live site)
//   3. NEXT_PUBLIC_SUPABASE_URL is NOT a hosted supabase.co project
//      (i.e. a local Supabase stack is running — the definitive guard)
//
// WHY THE SUPABASE URL CHECK IS THE DEFINITIVE GATE:
//   The normal .env.local in this project points at the PRODUCTION Supabase
//   database. Publishing a row sets status='published', which RLS exposes to
//   the public SELECT policy. If the live site's ISR cache for /blog
//   regenerates during the test window, the test post could briefly appear on
//   the live site. The only safe configuration for this test group is
//   a local Supabase instance (e.g. started with `supabase start`), pointed at
//   by a separate .env.local override. E2E_ALLOW_PUBLISH=1 is the operator's
//   confirmation that they have set that up; the URL check is the hard
//   enforcement that they actually have.
//
// TO RUN THIS GROUP:
//   1. Start a local Supabase stack: `supabase start`
//   2. Copy .env.local to .env.local.publish, set NEXT_PUBLIC_SUPABASE_URL to
//      the local stack URL (http://127.0.0.1:54321 by default)
//   3. E2E_ALLOW_PUBLISH=1 E2E_BASE_URL=http://localhost:3000 \
//        npx dotenv -e .env.local.publish -- playwright test admin-posts \
//        --project=desktop-chrome
// ---------------------------------------------------------------------------

/** True only when the Supabase URL is a local instance (not supabase.co). */
function isLocalSupabase(): boolean {
  try {
    const url = new URL(testEnv.supabaseUrl());
    return !url.hostname.endsWith('supabase.co');
  } catch {
    return false;
  }
}

const isLocalWebTarget =
  new URL(process.env.E2E_BASE_URL ?? 'https://example.com').hostname === 'localhost';

const publishAllowed =
  !!process.env.E2E_ALLOW_PUBLISH && isLocalWebTarget && isLocalSupabase();

const publishSkipReason = !process.env.E2E_ALLOW_PUBLISH
  ? 'set E2E_ALLOW_PUBLISH=1 to enable publish-flow tests'
  : !isLocalWebTarget
    ? 'publish-flow tests require E2E_BASE_URL=http://localhost:3000'
    : 'publish-flow tests require a local Supabase instance (NEXT_PUBLIC_SUPABASE_URL must not be a supabase.co URL) — never run against the prod DB';

test.describe('admin posts publish flow', () => {
  test.skip(!publishAllowed, publishSkipReason);

  let publishedSlug = '';

  test.afterEach(async ({ page, context }) => {
    if (!publishedSlug) return;

    // Cleanup: unpublish then delete via the UI, or direct DB delete as fallback
    const row = await findContentBySlug(publishedSlug);
    if (row) {
      await signInAsAdmin(context);
      await page.goto(`/admin/posts/${row.id}`);
      // Unpublish first (to remove public visibility ASAP)
      try {
        await page.getByRole('button', { name: 'Unpublish' }).click();
        await page.waitForURL('**/admin/posts', { timeout: 5000 });
        await page.goto(`/admin/posts/${row.id}`);
        await page.getByRole('button', { name: 'Delete post' }).click();
        await page.getByRole('button', { name: 'Yes, delete this post' }).click();
        await page.waitForURL('**/admin/posts', { timeout: 5000 });
      } catch {
        // Fallback: direct DB delete
        await cleanupTestContent();
      }
    }
    publishedSlug = '';
  });

  test('publish → appears at /blog/<slug>, then unpublish → 404', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    const slug = makeTestPostSlug();
    publishedSlug = slug;
    const ts = slug.replace('e2e-test-admin-', '');
    const title = `E2E Test Admin ${ts}`;

    // Create the post
    await page.goto('/admin/posts/new');
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Body (Markdown)').fill('## Publish test\n\nPublish flow e2e.');

    // Publish (not save draft)
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForURL('**/admin/posts');

    // Verify /blog/<slug> returns 200 and shows title
    const blogResponse = await page.goto(`/blog/${slug}`);
    expect(blogResponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title);

    // Verify /blog index lists the post
    await page.goto('/blog');
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    // Unpublish
    const row = await findContentBySlug(slug);
    await page.goto(`/admin/posts/${row!.id}`);
    await page.getByRole('button', { name: 'Unpublish' }).click();
    await page.waitForURL('**/admin/posts');

    // /blog/<slug> should now 404
    const after = await page.goto(`/blog/${slug}`);
    expect(after?.status()).toBe(404);

    // Delete
    await page.goto(`/admin/posts/${row!.id}`);
    await page.getByRole('button', { name: 'Delete post' }).click();
    await page.getByRole('button', { name: 'Yes, delete this post' }).click();
    await page.waitForURL('**/admin/posts');

    publishedSlug = '';
  });
});
