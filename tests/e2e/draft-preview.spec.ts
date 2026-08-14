import { test, expect } from '@playwright/test';
import { createAdminSessionCookies } from './helpers/session';
import { DRAFT_FIXTURE } from './helpers/fixtures';

/**
 * Draft Mode preview flow. The e2e-test-draft fixture (status=draft) is
 * upserted by global-setup; it never appears on the public site. Admin tests
 * use injected sessions (helpers/session.ts); gate tests use fresh contexts.
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

const DRAFT_PATH = `/blog/${DRAFT_FIXTURE.slug}`;
const ENABLE_PATH = `/api/draft/enable?slug=${DRAFT_FIXTURE.slug}&type=post`;

test.describe('draft preview as admin', () => {
  test('enable redirects to the draft post with the preview banner', async ({
    page,
    context,
  }) => {
    await context.addCookies(await createAdminSessionCookies());

    await page.goto(ENABLE_PATH);
    await page.waitForURL(`**${DRAFT_PATH}`);

    await expect(page.getByText('Previewing draft')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(DRAFT_FIXTURE.title);

    // The Draft Mode bypass cookie was set by the enable endpoint.
    const cookies = await context.cookies();
    expect(cookies.some(c => c.name === '__prerender_bypass' && c.value.length > 0)).toBe(true);
  });

  test('disable clears the bypass cookie and re-hides the draft', async ({ page, context }) => {
    await context.addCookies(await createAdminSessionCookies());

    // Enter preview, then leave it via the banner link.
    await page.goto(ENABLE_PATH);
    await page.waitForURL(`**${DRAFT_PATH}`);
    await page.getByRole('link', { name: 'Disable preview' }).click();
    await page.waitForURL('**/');

    // Bypass cookie is gone...
    const cookies = await context.cookies();
    expect(cookies.some(c => c.name === '__prerender_bypass' && c.value.length > 0)).toBe(false);

    // ...and the draft is unreachable again, even with the admin session.
    const response = await page.goto(DRAFT_PATH);
    expect(response?.status()).toBe(404);
  });
});

test.describe('draft preview without a session', () => {
  test('enable endpoint returns a bare 404 (admin gate holds)', async ({ page }) => {
    const response = await page.goto(ENABLE_PATH);
    expect(response?.status()).toBe(404);
  });

  test('the draft post is not publicly reachable', async ({ page }) => {
    const response = await page.goto(DRAFT_PATH);
    expect(response?.status()).toBe(404);
  });
});
