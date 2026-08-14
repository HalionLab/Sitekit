import { test, expect } from '@playwright/test';
import { signInAsAdmin } from './helpers/session';
import {
  DRAFT_FIXTURE,
  makeTestPageSlug,
  findContentBySlug,
  cleanupTestPages,
} from './helpers/fixtures';

/**
 * E2E tests for the admin pages editor (/admin/pages).
 *
 * Mirrors admin-posts.spec.ts. The pages CRUD reuses the shared ContentEditor
 * and the savePost/deletePost server actions (kind="page"); the page-specific
 * behavior under test is (a) the kind-aware redirect back to /admin/pages,
 * (b) the DB reserved-slug rejection surfaced in the editor, and (c) the
 * [id] route's kind guard (a post id must not open in the page editor).
 *
 * SAFETY: Every test that writes to content_items uses slugs prefixed
 * "e2e-test-page-" and status='draft' (drafts are never publicly visible via
 * RLS). Per-block cleanup runs in afterAll; global teardown (cleanupTestPages)
 * is the additional safety net. No test in this file publishes.
 *
 * The dev server and local .env.local both point at the PRODUCTION Supabase
 * database. Run locally only with E2E_BASE_URL=http://localhost:3000:
 *   npx dotenv -e .env.local -- playwright test admin-pages --project=desktop-chrome
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

test.describe('admin pages list page', () => {
  test('renders heading and New page button with an admin session', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);
    await page.goto('/admin/pages');

    await expect(page.getByRole('heading', { name: 'Pages', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New page' })).toBeVisible();
  });

  test('redirects to /login without a session', async ({ page }) => {
    await page.goto('/admin/pages');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible();
  });
});

/**
 * Create → Edit → Delete as a serial block so state flows between tests. The
 * key page-specific assertion in each is waitForURL('**​/admin/pages') — proof
 * the kind-aware redirect in savePost/deletePost routes pages back to the pages
 * list (and not /admin/posts).
 */
test.describe.serial('admin pages draft lifecycle', () => {
  let createdSlug = '';

  test.afterAll(async () => {
    // Runs once after the serial block: removes the row if the delete test
    // never got to it (serial mode skips remaining tests after a failure).
    // No-op on the happy path; global teardown is the final safety net.
    if (createdSlug) {
      const row = await findContentBySlug(createdSlug);
      if (row) {
        await cleanupTestPages();
      }
    }
  });

  test('create draft: fills form, saves, returns to /admin/pages, verifies DB', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    const slug = makeTestPageSlug();
    createdSlug = slug;

    // Title "E2E Test Page <ts>" derives to "e2e-test-page-<ts>" via deriveSlug().
    const ts = slug.replace('e2e-test-page-', '');
    const title = `E2E Test Page ${ts}`;

    await page.goto('/admin/pages/new');
    await expect(page.getByRole('heading', { name: 'New page', level: 1 })).toBeVisible();

    // Fill title — slug field auto-derives
    await page.getByLabel('Title', { exact: true }).fill(title);
    await expect(page.locator('#slug-input')).toHaveValue(slug);

    await page.getByLabel('Body (Markdown)').fill('## Hello\n\nThis is an **e2e** test page.\n');

    // Save as draft → kind-aware redirect lands on /admin/pages
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/pages');

    // New page appears in the list with a draft badge
    await expect(page.getByRole('link', { name: title })).toBeVisible();
    const pageRow = page.getByRole('link', { name: title }).locator('..');
    await expect(pageRow.getByText('draft')).toBeVisible();

    // DB assertion via service-role client
    const row = await findContentBySlug(slug);
    expect(row).not.toBeNull();
    expect(row?.status).toBe('draft');
    expect(row?.title).toBe(title);
  });

  test('edit draft: changes title, returns to /admin/pages, verifies DB', async ({
    page,
    context,
  }) => {
    expect(createdSlug).not.toBe('');

    await signInAsAdmin(context);

    const row = await findContentBySlug(createdSlug);
    expect(row).not.toBeNull();

    await page.goto(`/admin/pages/${row!.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const updatedTitle = `${row!.title} — edited`;
    await page.getByLabel('Title', { exact: true }).fill(updatedTitle);

    // Slug is locked on existing rows — we leave it, so createdSlug stays valid
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/pages');

    await expect(page.getByRole('link', { name: updatedTitle })).toBeVisible();

    const updated = await findContentBySlug(createdSlug);
    expect(updated?.title).toBe(updatedTitle);
    expect(updated?.status).toBe('draft');
  });

  test('delete draft: two-step confirm removes page from list and DB', async ({
    page,
    context,
  }) => {
    expect(createdSlug).not.toBe('');

    await signInAsAdmin(context);

    const row = await findContentBySlug(createdSlug);
    expect(row).not.toBeNull();

    await page.goto(`/admin/pages/${row!.id}`);

    // First click reveals the confirm UI (the shared editor's copy says "post").
    await page.getByRole('button', { name: 'Delete post' }).click();
    await expect(page.getByRole('button', { name: 'Yes, delete this post' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Confirm → kind-aware redirect lands on /admin/pages
    await page.getByRole('button', { name: 'Yes, delete this post' }).click();
    await page.waitForURL('**/admin/pages');

    await expect(page.getByRole('link', { name: row!.title })).not.toBeVisible();

    const deleted = await findContentBySlug(createdSlug);
    expect(deleted).toBeNull();

    // Clear so afterAll no-ops (row is already gone)
    createdSlug = '';
  });
});

test.describe('admin pages reserved-slug rejection', () => {
  test('saving a page with a DB-reserved slug shows an error and creates no row', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);
    await page.goto('/admin/pages/new');

    // Title is required; fill it, then override the derived slug with a
    // DB-reserved value. "pricing" is in the reserved_slugs table (0002), so the
    // insert trigger rejects it and savePost maps it to a friendly message.
    await page.getByLabel('Title', { exact: true }).fill('Reserved Slug Test');
    await page.locator('#slug-input').fill('pricing');

    await page.getByRole('button', { name: 'Save draft' }).click();

    // Error surfaces in the editor; we stay on the new-page route (no redirect).
    // Target the message text directly — getByRole('alert') also matches Next's
    // empty __next-route-announcer__ div, which trips strict mode.
    await expect(
      page.getByText('That slug is reserved and cannot be used.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/pages\/new$/);

    // No row was created for the reserved slug.
    const row = await findContentBySlug('pricing');
    expect(row).toBeNull();
  });
});

test.describe('admin pages [id] kind guard', () => {
  test('opening a post id under /admin/pages 404s (cannot edit a post as a page)', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    // The draft post fixture (kind="post") is ensured by global-setup.
    const postRow = await findContentBySlug(DRAFT_FIXTURE.slug);
    expect(postRow).not.toBeNull();

    const response = await page.goto(`/admin/pages/${postRow!.id}`);
    expect(response?.status()).toBe(404);
  });
});
