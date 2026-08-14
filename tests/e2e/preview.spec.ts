import { test, expect } from '@playwright/test';

/**
 * /preview -- the "kitchen sink" route that renders every section key with
 * sample copy (see app/(site)/preview/page.tsx). Each section is preceded by
 * a label `{key} — components/sections/{Component}.tsx`; this only checks
 * for the `{key} —` prefix so it doesn't need to duplicate the component-name
 * map. Keys are hardcoded here (not imported from the app) per e2e
 * convention -- keep this list in sync with lib/config/validate.ts's
 * ALL_SECTION_KEYS if a new section is ever added.
 */
const ALL_SECTION_KEYS = [
  'hero',
  'servicesGrid',
  'about',
  'testimonials',
  'gallery',
  'faq',
  'pricing',
  'contactBand',
  'teamGrid',
  'processSteps',
  'statsBand',
  'logoStrip',
  'ctaBand',
  'hoursMap',
  'blogTeaser',
] as const;

test('shows all 15 section labels', async ({ page }) => {
  expect(ALL_SECTION_KEYS).toHaveLength(15);

  await page.goto('/preview');
  // The page's own <h1> ("Section preview") is followed by the Hero
  // section's <h1> further down the kitchen sink -- scope to the first.
  await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Section preview');

  for (const key of ALL_SECTION_KEYS) {
    await expect(page.getByText(`${key} —`, { exact: false }).first()).toBeVisible();
  }
});
