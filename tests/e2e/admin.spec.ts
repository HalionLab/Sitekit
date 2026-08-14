import { test, expect } from '@playwright/test';
import { createAdminSessionCookies } from './helpers/session';
import { testEnv } from './helpers/env';

/**
 * Admin gate behavior. Signed-in tests use injected sessions created through
 * the Supabase admin API (no magic-link email is sent) -- see
 * helpers/session.ts. The real magic-link email flow is verified manually.
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

test.describe('admin page with an injected admin session', () => {
  test('renders the signed-in card with the admin email', async ({ page, context }) => {
    await context.addCookies(await createAdminSessionCookies());
    await page.goto('/admin');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      `Signed in as ${testEnv.adminEmail()}`,
      { ignoreCase: true },
    );
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});

test.describe('admin page without a session', () => {
  test('redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible();
  });
});
