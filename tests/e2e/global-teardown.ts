import {
  cleanupTestLeads,
  cleanupTestContent,
  cleanupTestPages,
} from './helpers/fixtures';

/**
 * Runs once after the suite: removes test leads and any e2e-test- content
 * rows. No-ops entirely when NEXT_PUBLIC_SUPABASE_URL is unset -- see
 * global-setup.ts.
 */
export default async function globalTeardown() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

  const removedLeads = await cleanupTestLeads();
  if (removedLeads > 0) {
    console.log(`global-teardown: removed ${removedLeads} test lead(s)`);
  }

  // Safety-net: delete any e2e-test-admin- post rows that individual tests
  // may have failed to clean up (e.g. due to a crash mid-test).
  const removedContent = await cleanupTestContent();
  if (removedContent > 0) {
    console.log(`global-teardown: removed ${removedContent} stale e2e-test-admin- post(s)`);
  }

  // Safety-net: same for e2e-test-page- page rows.
  const removedPages = await cleanupTestPages();
  if (removedPages > 0) {
    console.log(`global-teardown: removed ${removedPages} stale e2e-test-page- page(s)`);
  }
}
