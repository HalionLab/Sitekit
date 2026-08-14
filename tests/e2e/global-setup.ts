import { ensureDraftFixture, cleanupTestLeads } from './helpers/fixtures';

/**
 * Runs once before the suite: makes sure the draft-preview fixture exists and
 * clears any test leads left behind by a previous (crashed) run.
 *
 * No-ops entirely when NEXT_PUBLIC_SUPABASE_URL is unset -- the file-mode
 * specs (file-mode, contact, preview, public, landing.visual) need no
 * Supabase fixture, and the Supabase-dependent specs (admin*, draft-preview,
 * lead-capture) self-skip via `test.skip` at the top of each file. This is
 * the only place this env var is checked for the whole harness.
 */
export default async function globalSetup() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

  await ensureDraftFixture();
  const removed = await cleanupTestLeads();
  if (removed > 0) {
    console.log(`global-setup: removed ${removed} stale test lead(s)`);
  }
}
