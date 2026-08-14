import { test, expect, type Page } from '@playwright/test';
import { makeTestLeadEmail, findLeadsByEmail } from './helpers/fixtures';

/**
 * Lead capture, running against the production Supabase project. Test emails
 * use the playwright-e2e+<timestamp>@example.com pattern so rows are
 * recognizable in the dashboard; global setup/teardown deletes them.
 *
 * Rate limiting (5 submissions per IP hash per hour) is intentionally not
 * tested: it would require manipulating production rate-limit state, and
 * tripping it would also break this spec's own row-insert assertion for the
 * rest of the hour. For the same reason, avoid running this spec more than
 * ~4 times within one hour from the same IP.
 */
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'requires Supabase env');

/**
 * Fills and submits the #report lead form; returns the section locator for
 * follow-up assertions. The honeypot value is only set by the bot-behavior
 * test -- it is an uncontrolled off-screen input read via FormData at submit,
 * so writing .value directly (bypassing actionability checks) is enough.
 */
async function submitReportForm(page: Page, email: string, honeypot?: string) {
  await page.goto('/');
  const section = page.locator('#report');
  if (honeypot) {
    await section.locator('input[name="company"]').evaluate((el, value) => {
      (el as HTMLInputElement).value = value;
    }, honeypot);
  }
  await section.getByLabel('Email address').fill(email);
  await section.getByRole('button', { name: /Send me the report/i }).click();
  return section;
}

test.describe('lead capture', () => {
  test('valid submit on the report form succeeds and inserts a row', async ({ page }) => {
    const email = makeTestLeadEmail();
    const reportSection = await submitReportForm(page, email);

    await expect(reportSection.getByRole('status')).toContainText('check your inbox', {
      timeout: 10_000,
    });

    // The success state is only trustworthy if the row actually landed.
    const rows = await findLeadsByEmail(email);
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe('download');
  });

  test('honeypot submission fakes success but inserts nothing', async ({ page }) => {
    const email = makeTestLeadEmail();
    const reportSection = await submitReportForm(page, email, 'Acme Bots Inc');

    // The bot sees the same success state a real user would...
    await expect(reportSection.getByRole('status')).toContainText('check your inbox', {
      timeout: 10_000,
    });

    // ...but nothing was written.
    const rows = await findLeadsByEmail(email);
    expect(rows).toHaveLength(0);
  });

  test('invalid email is blocked client-side by HTML5 validation', async ({ page }) => {
    const reportSection = await submitReportForm(page, 'not-an-email');

    // The browser blocks submission; the form stays in its idle state.
    await expect(reportSection.getByRole('status')).toHaveCount(0);
    await expect(reportSection.getByLabel('Email address')).toBeVisible();
  });
});
