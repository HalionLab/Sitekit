import { test, expect } from '@playwright/test';

/**
 * Public, read-only flows against the file-mode Summit Services default
 * config. Assertions target the seeded content in content/posts and
 * content/pages, plus the section copy in site.config.ts. Runs with no env
 * vars set (`npm run test:e2e`).
 */

const SEED_POST_SLUG = 'welcome-to-our-new-website';
const SEED_POST_TITLE = 'Welcome to our new website';

test.describe('homepage', () => {
  test('renders hero, anchor sections, and header', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Heating, cooling, and plumbing',
    );

    // Anchor targets for the Services / About / FAQ / Contact / Hours nav
    // links and CTAs all exist.
    await expect(page.locator('#services')).toBeAttached();
    await expect(page.locator('#about')).toBeAttached();
    await expect(page.locator('#faq')).toBeAttached();
    await expect(page.locator('#contact')).toBeAttached();
    await expect(page.locator('#hours')).toBeAttached();

    // Header brand link points home.
    await expect(page.locator('header a[href="/"]')).toBeVisible();
  });

  test('primary nav links resolve to the right routes', async ({ page, isMobile }) => {
    test.skip(isMobile, 'primary nav is hidden on mobile viewports');
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/#services');
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about');
    await expect(nav.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/#faq');
    await expect(nav.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });
});

test.describe('blog', () => {
  test('index lists the published post and links to its detail page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Notes and advice');

    const postLink = page.getByRole('link', { name: new RegExp(SEED_POST_TITLE) });
    await expect(postLink).toBeVisible();
    await expect(page.getByText(/min read/).first()).toBeVisible();

    await postLink.click();
    await page.waitForURL(`**/blog/${SEED_POST_SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(SEED_POST_TITLE);
  });

  test('post detail renders title, markdown body, reading time, and back link', async ({
    page,
  }) => {
    await page.goto(`/blog/${SEED_POST_SLUG}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(SEED_POST_TITLE);
    await expect(page.locator('.prose-blog')).toBeVisible();
    await expect(page.locator('article h2').first()).toBeVisible();
    await expect(page.getByText(/min read/)).toBeVisible();

    await page.getByRole('link', { name: /Back to blog/i }).click();
    await page.waitForURL('**/blog');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Notes and advice');
  });
});

test.describe('content pages', () => {
  test('/about renders the published page', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('About Summit Services');
    await expect(page.locator('.prose-blog')).toBeVisible();
  });
});

test.describe('not-found and reserved slugs', () => {
  test('unknown post slug returns 404', async ({ page }) => {
    const response = await page.goto('/blog/this-post-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
  });

  test('unknown content slug returns 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
  });

  test('reserved slug /admin returns 404 (cms feature is off in file mode)', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(404);
  });
});

test.describe('cross-page navigation', () => {
  test('Blog link from home navigates to /blog', async ({ page, isMobile }) => {
    test.skip(isMobile, 'primary nav is hidden on mobile viewports');
    await page.goto('/');

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Blog' })
      .click();
    await page.waitForURL('**/blog');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Contact link from /blog navigates to /contact', async ({ page, isMobile }) => {
    test.skip(isMobile, 'primary nav is hidden on mobile viewports');
    await page.goto('/blog');

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Contact' })
      .click();
    await page.waitForURL('**/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Services link from /contact navigates home to #services', async ({ page, isMobile }) => {
    test.skip(isMobile, 'primary nav is hidden on mobile viewports');
    await page.goto('/contact');

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Services' })
      .click();
    await page.waitForURL(/#services$/);
    await expect(page.locator('#services')).toBeVisible();
  });
});
