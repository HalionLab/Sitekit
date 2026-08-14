import { test, expect } from '@playwright/test';

/**
 * /contact form. Runs against file mode with no RESEND_API_KEY set --
 * submitEnquiry() degrades to a success in that case (see
 * app/(site)/contact/actions.ts), so the form always reports success
 * locally. Excluded from mobile-chrome (playwright.config.ts) since the
 * write path is identical across viewports.
 */

test.describe('contact form', () => {
  test('fill and submit shows the exact success copy', async ({ page }) => {
    await page.goto('/contact');

    await page.getByLabel('Name').fill('Jane Homeowner');
    await page.getByLabel('Email address').fill('jane@example.com');
    await page.getByLabel('Message').fill('Furnace is making a rattling noise, can someone take a look?');

    await page.getByRole('button', { name: 'Send message' }).click();

    const status = page.getByRole('status');
    await expect(status).toContainText('Message sent.');
    await expect(status).toContainText(
      "Thanks — we'll get back to you within one business day.",
    );
  });

  test('honeypot field is present but invisible to real users', async ({ page }) => {
    await page.goto('/contact');

    const honeypot = page.locator('input[name="company"]');
    await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(honeypot).toHaveCSS('opacity', '0');
  });

  test('empty email is blocked by native HTML5 validation', async ({ page }) => {
    await page.goto('/contact');

    await page.getByLabel('Name').fill('Jane Homeowner');
    await page.getByLabel('Message').fill('Need a quote.');

    const emailInput = page.getByLabel('Email address');
    await page.getByRole('button', { name: 'Send message' }).click();

    // The browser blocks submission -- the form never reaches the success state.
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(emailInput).toBeVisible();
    expect(await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid)).toBe(false);
  });
});
