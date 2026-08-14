import { test, expect } from '@playwright/test';

/**
 * Pixel snapshots are OS-specific (Playwright names them *-win32.png here,
 * *-linux.png in CI) -- these baselines were captured and eyeballed locally
 * on win32 only. Skip on CI (ubuntu-latest) rather than fail on a missing
 * linux baseline.
 *
 * TODO: capture linux baselines (e.g. via the same CI image, uploaded back
 * into the repo) so this suite actually runs in CI instead of skipping.
 */
test.skip(!!process.env.CI, 'visual baselines are win32-local');

test.describe('landing page visual', () => {
  test('desktop 1440px matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-desktop.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });

  test('mobile 375px matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-mobile.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});
