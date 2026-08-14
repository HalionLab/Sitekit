/**
 * E2E tests for admin image upload — cover + inline.
 *
 * ⚠️  PRODUCTION STORAGE WARNING ⚠️
 * These tests write real objects to the PRODUCTION Supabase Storage `media`
 * bucket (local dev uses the same prod Supabase project). The first prod run
 * is GATED and ATTENDED by the human operator (orchestrator) who must review
 * the removeStorageObjects call and the uploadedKeys list before allowing the
 * tests to execute.
 *
 * Cleanup strategy — TRACKED-KEY REMOVAL ONLY:
 *   - Every key this spec uploads is pushed into module-scoped `uploadedKeys`.
 *   - afterAll calls removeStorageObjects(uploadedKeys), which calls
 *     storage.from('media').remove([...exact keys...]).
 *   - storage.list() is NEVER called. removeStorageObjects never lists the
 *     bucket. Only the exact keys tracked by this spec are deleted.
 *   - See helpers/fixtures.ts removeStorageObjects for the full safety contract.
 *
 * Run with desktop-chrome only (mobile-chrome testIgnore covers this file).
 * To run for real (first attended run):
 *   npx dotenv -e .env.local -- playwright test admin-upload --project=desktop-chrome
 * To verify tests parse/discover without running:
 *   npx playwright test admin-upload --list
 */

import { test, expect } from '@playwright/test';
import { signInAsAdmin } from './helpers/session';
import {
  makeTestPostSlug,
  cleanupTestContent,
  getContentRowBySlug,
  removeStorageObjects,
  mediaPublicUrl,
} from './helpers/fixtures';

test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

// ---------------------------------------------------------------------------
// Seed asset — a 1x1 PNG built in memory from a base64 literal and handed to
// setInputFiles as a FilePayload. The template ships no checked-in raster
// images (the favicon is generated at request time by app/icon.tsx), so the
// upload path is exercised without adding a binary fixture to the repo.
// ---------------------------------------------------------------------------
const SEED_IMAGE = {
  name: 'seed.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  ),
};

// ---------------------------------------------------------------------------
// Tracked keys — pushed as soon as a key is learned from the DB row.
// afterAll always fires (even on test failure) and removes exactly these keys.
// ---------------------------------------------------------------------------
const uploadedKeys: string[] = [];

test.describe.serial('admin image upload', () => {
  /**
   * Slug shared across the serial block so the cover and inline tests can
   * operate on the same post without each creating a new one.
   */
  let postSlug = '';
  let postId = '';

  test.afterAll(async () => {
    // Remove the exact storage objects this spec uploaded — no listing, no
    // broad scan. See removeStorageObjects JSDoc in helpers/fixtures.ts.
    await removeStorageObjects(uploadedKeys);

    // Remove the DB rows (safety net on top of individual test cleanup).
    await cleanupTestContent();
  });

  // -------------------------------------------------------------------------
  // Test 1: Cover upload + persist
  // -------------------------------------------------------------------------
  test('cover upload: uploads image, persists cover_image_path and alt in DB', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    const slug = makeTestPostSlug();
    postSlug = slug;
    const ts = slug.replace('e2e-test-admin-', '');
    const title = `E2E Test Admin ${ts}`;
    const coverAlt = 'E2E cover image alt text';

    await page.goto('/admin/posts/new');
    await expect(page.getByRole('heading', { name: 'New post', level: 1 })).toBeVisible();

    // Fill title so the slug derives correctly
    await page.getByLabel('Title', { exact: true }).fill(title);
    await expect(page.locator('#slug-input')).toHaveValue(slug);

    // Scope all Cover image interactions to the fieldset
    const coverFieldset = page.locator('fieldset').filter({ hasText: 'Cover image' });

    // Fill alt text BEFORE setting the file (upload is blocked without alt)
    await coverFieldset.locator('input[name="cover_image_alt"]').fill(coverAlt);

    // Set the sr-only file input (it is attached to the DOM, setInputFiles works)
    await coverFieldset.locator('input[type="file"]').setInputFiles(SEED_IMAGE);

    // Wait for the preview <img> to appear — upload is async (signed-URL + browser upload)
    await expect(coverFieldset.locator('img')).toBeVisible({ timeout: 15000 });

    // Save draft
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/posts');

    // Read back the DB row
    const row = await getContentRowBySlug(slug);
    expect(row).not.toBeNull();
    postId = row!.id;

    // cover_image_path must follow the buildUploadPath convention
    expect(row!.cover_image_path).toMatch(/^uploads\/\d+-.*\.png$/);
    expect(row!.cover_image_alt).toBe(coverAlt);

    // Track the key so afterAll can remove it
    const coverKey = row!.cover_image_path!;
    uploadedKeys.push(coverKey);

    // Existence proof: the public URL must return 200
    // (no storage.list() — just a HEAD fetch against the known path)
    const publicUrl = mediaPublicUrl(coverKey);
    const response = await page.request.head(publicUrl);
    expect(response.status()).toBe(200);
  });

  // -------------------------------------------------------------------------
  // Test 2: Alt required before upload
  // -------------------------------------------------------------------------
  test('cover upload: shows inline error when alt is empty and upload is attempted', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);
    await page.goto('/admin/posts/new');

    const coverFieldset = page.locator('fieldset').filter({ hasText: 'Cover image' });

    // Ensure alt input is empty (default state)
    await expect(coverFieldset.locator('input[name="cover_image_alt"]')).toHaveValue('');

    // Set the file input with alt empty — should trigger the inline error
    await coverFieldset.locator('input[type="file"]').setInputFiles(SEED_IMAGE);

    // Inline error must appear
    await expect(
      coverFieldset.getByRole('alert'),
    ).toContainText('Add alt text before uploading.', { timeout: 5000 });

    // Preview image must NOT appear (no upload occurred)
    await expect(coverFieldset.locator('img')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Test 3: Inline image insert
  // -------------------------------------------------------------------------
  test('inline image insert: inserts markdown snippet into body and persists in DB', async ({
    page,
    context,
  }) => {
    await signInAsAdmin(context);

    // Use the post created by Test 1 if it exists; otherwise create a fresh one.
    // (Serial mode: Test 1 always runs first, so postId is set.)
    let targetId = postId;
    let targetSlug = postSlug;

    if (!targetId) {
      // Fallback: create a new post (should not happen in normal serial execution)
      const slug = makeTestPostSlug();
      targetSlug = slug;
      const ts = slug.replace('e2e-test-admin-', '');
      const title = `E2E Test Admin ${ts}`;

      await page.goto('/admin/posts/new');
      await page.getByLabel('Title', { exact: true }).fill(title);
      await page.getByRole('button', { name: 'Save draft' }).click();
      await page.waitForURL('**/admin/posts');

      const row = await getContentRowBySlug(slug);
      expect(row).not.toBeNull();
      targetId = row!.id;
    }

    await page.goto(`/admin/posts/${targetId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const inlineAlt = 'E2E inline image alt text';

    // Scope to the Insert image container (the <p> inside reads "Insert image")
    const inserterBox = page.locator('div').filter({ hasText: /^Insert image/ }).first();

    // Fill alt text in the inserter BEFORE setting the file
    await inserterBox.locator('input[type="text"]').fill(inlineAlt);

    // Set the hidden file input inside the inserter
    await inserterBox.locator('input[type="file"]').setInputFiles(SEED_IMAGE);

    // Wait for the body textarea value to contain the inserted markdown snippet.
    // The snippet format is ![alt](uploads/<ts>-<name>.png)
    const bodyTextarea = page.getByLabel('Body (Markdown)');
    await expect(bodyTextarea).toContainText(`![${inlineAlt}](uploads/`, { timeout: 15000 });

    // Save draft
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForURL('**/admin/posts');

    // Read back the row and extract the inline key
    const row = await getContentRowBySlug(targetSlug);
    expect(row).not.toBeNull();
    expect(row!.body_markdown).not.toBeNull();

    // Parse the uploads/ key out of body_markdown
    // Markdown snippet: ![alt](uploads/<ts>-<name>.<ext>)
    const inlineKeyMatch = row!.body_markdown!.match(/!\[[^\]]*\]\((uploads\/[^)]+)\)/);
    expect(inlineKeyMatch).not.toBeNull();
    const inlineKey = inlineKeyMatch![1];
    expect(inlineKey).toMatch(/^uploads\/\d+-.*\.png$/);

    // Track for cleanup
    uploadedKeys.push(inlineKey);

    // Existence proof via public URL fetch
    const publicUrl = mediaPublicUrl(inlineKey);
    const response = await page.request.head(publicUrl);
    expect(response.status()).toBe(200);
  });
});
