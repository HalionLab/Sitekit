import { test, expect } from '@playwright/test';
import { createAdminSessionCookies } from './helpers/session';

/**
 * Leads admin view + CSV export gate. Signed-in tests inject a Supabase
 * session via the admin API (no magic-link email) -- see helpers/session.ts.
 * Stateful/admin specs run desktop-only (excluded from mobile-chrome in
 * playwright.config.ts).
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

const EXPORT_PATH = '/api/admin/leads/export';
const CSV_HEADER = 'email,source,created_at,unsubscribed_at,notes';

test.describe('leads admin without a session', () => {
  test(`${EXPORT_PATH} returns 404`, async ({ context }) => {
    const res = await context.request.get(EXPORT_PATH);
    expect(res.status()).toBe(404);
  });

  test('/admin/leads redirects to /login', async ({ page }) => {
    await page.goto('/admin/leads');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible();
  });
});

test.describe('leads admin with an injected admin session', () => {
  test('renders the Leads view with an Export control', async ({ page, context }) => {
    await context.addCookies(await createAdminSessionCookies());
    await page.goto('/admin/leads');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Leads');
    await expect(page.getByRole('link', { name: 'Export CSV' })).toBeVisible();
  });

  test('exports a CSV with the expected header', async ({ context }) => {
    await context.addCookies(await createAdminSessionCookies());
    const res = await context.request.get(EXPORT_PATH);

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/csv');
    expect(res.headers()['content-disposition']).toContain('attachment');
    expect(res.headers()['cache-control']).toContain('no-store');

    const body = await res.text();
    expect(body.split('\n')[0]).toBe(CSV_HEADER);
  });
});
