import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Defaults to a local dev server (Playwright will start one); set
 * E2E_BASE_URL to target a deployment.
 *
 * Two tiers of specs:
 *   - File-mode specs (file-mode, contact, preview, public, landing.visual)
 *     need no env at all -- `npm run test:e2e` (plain `playwright test`) runs
 *     them everywhere, including CI.
 *   - Supabase-dependent specs (admin*, draft-preview, lead-capture)
 *     self-skip via `test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, ...)`
 *     at the top of each file. Run them for real with
 *     `npm run test:e2e:supabase`, which loads .env.local (Supabase
 *     service-role key + ADMIN_EMAILS) via dotenv-cli.
 *
 * globalSetup/globalTeardown are like the Supabase specs: unconditionally
 * wired in below, but no-op internally when NEXT_PUBLIC_SUPABASE_URL is unset
 * (see global-setup.ts).
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const isLocalhost = new URL(baseURL).hostname === 'localhost';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  // 'html' is written even when everything passes; CI only *uploads* it via
  // `actions/upload-artifact` `if: failure()` in .github/workflows/ci.yml.
  // `open: 'never'` so a local run never pops a browser tab.
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  ...(isLocalhost
    ? {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }
    : {}),
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Mobile re-runs the read-only public specs. Stateful specs (lead
      // writes, admin sessions, draft mode, admin content CRUD) run once, on
      // desktop, to avoid duplicate DB writes and duplicate auth sessions.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: [
        '**/lead-capture.spec.ts',
        '**/admin.spec.ts',
        '**/admin-posts.spec.ts',
        '**/admin-pages.spec.ts',
        '**/admin-leads.spec.ts',
        '**/admin-upload.spec.ts',
        '**/draft-preview.spec.ts',
        // File-mode form-submit writes (contact enquiries) are duplicated,
        // not stateful in a way worth re-verifying on a second viewport.
        '**/contact.spec.ts',
      ],
    },
  ],
});
