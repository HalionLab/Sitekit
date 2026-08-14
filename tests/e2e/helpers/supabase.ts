import { createClient } from '@supabase/supabase-js';
import { testEnv } from './env';

/**
 * Service-role client for test fixtures and assertions (bypasses RLS).
 * Standalone -- does not reuse lib/supabase/admin.ts because that module
 * imports 'server-only', which throws outside React Server Components.
 */
export function createServiceRoleClient() {
  return createClient(testEnv.supabaseUrl(), testEnv.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
