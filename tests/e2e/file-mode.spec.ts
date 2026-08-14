import { test, expect } from '@playwright/test';

/**
 * File-mode coverage of the Summit Services default config: every homepage
 * section renders its config copy, blog respects draft status, legal pages
 * substitute their placeholders, and reserved/CMS-only routes 404. Runs with
 * no env vars set (`npm run test:e2e`).
 */

const SEED_POST_SLUG = 'welcome-to-our-new-website';
const SEED_POST_TITLE = 'Welcome to our new website';
const DRAFT_POST_TITLE = 'Five questions to ask before hiring any home-services contractor';

test.describe('homepage sections', () => {
  test('renders all ten default sections with their config copy', async ({ page }) => {
    await page.goto('/');

    // hero
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Heating, cooling, and plumbing',
    );
    await expect(page.getByText('Denver, CO · Licensed & insured')).toBeVisible();

    // logoStrip
    await expect(page.getByText('Brands we service')).toBeVisible();

    // servicesGrid
    await expect(page.getByRole('heading', { name: /Full-service HVAC & plumbing/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Heating repair & installation' })).toBeVisible();

    // about
    await expect(page.locator('#about').getByText('About Summit Services')).toBeVisible();
    await expect(page.getByText("What we don't do")).toBeVisible();

    // processSteps
    await expect(page.getByRole('heading', { name: /From call to clean walkthrough/ })).toBeVisible();

    // statsBand
    await expect(page.getByRole('heading', { name: 'Numbers that matter' })).toBeVisible();
    await expect(page.getByText('15+ yrs')).toBeVisible();

    // testimonials
    await expect(page.getByText('What neighbors say')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Testimonials' })).toBeVisible();

    // faq
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();

    // contactBand
    await expect(page.getByRole('heading', { name: 'Ready when you are' })).toBeVisible();

    // hoursMap
    await expect(page.getByRole('heading', { name: 'Visit or call us' })).toBeVisible();
  });

  test('primary nav links resolve', async ({ page, isMobile }) => {
    test.skip(isMobile, 'primary nav is hidden on mobile viewports');
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    for (const [label, href] of [
      ['Services', '/#services'],
      ['About', '/#about'],
      ['FAQ', '/#faq'],
      ['Blog', '/blog'],
      ['Contact', '/contact'],
    ] as const) {
      await expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });
});

test.describe('blog respects draft status', () => {
  test('/blog lists the published post and never the draft', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByRole('link', { name: new RegExp(SEED_POST_TITLE) })).toBeVisible();
    await expect(page.getByText(DRAFT_POST_TITLE)).toHaveCount(0);
  });

  test('the draft post is not directly reachable', async ({ page }) => {
    const response = await page.goto('/blog/five-questions-before-hiring');
    expect(response?.status()).toBe(404);
  });

  test('post page renders a markdown h2', async ({ page }) => {
    await page.goto(`/blog/${SEED_POST_SLUG}`);
    await expect(page.getByRole('heading', { level: 2, name: "What's new" })).toBeVisible();
  });
});

test.describe('CMS-only routes 404 in file mode', () => {
  test('/admin returns 404', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(404);
  });

  test('/login returns 404', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(404);
  });
});

test.describe('machine-readable routes', () => {
  test('/sitemap.xml contains the post URL and never /login', async ({ request, baseURL }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();

    expect(body).toContain(`/blog/${SEED_POST_SLUG}`);
    expect(body).not.toContain('/login');
    void baseURL;
  });

  test('/llms.txt contains the site name', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();

    expect(body).toContain('Summit Services');
  });
});

test.describe('legal pages substitute placeholders', () => {
  test('/privacy renders the business name with no unsubstituted placeholders', async ({
    page,
  }) => {
    await page.goto('/privacy');

    const article = page.locator('article');
    await expect(article).toContainText('Summit Services');
    const text = await article.innerText();
    expect(text).not.toContain('{{');
  });

  test('/terms renders the business name with no unsubstituted placeholders', async ({ page }) => {
    await page.goto('/terms');

    const article = page.locator('article');
    await expect(article).toContainText('Summit Services LLC');
    const text = await article.innerText();
    expect(text).not.toContain('{{');
  });
});
