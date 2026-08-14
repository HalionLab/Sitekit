import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Cookieless anon client for public, published-content reads.
 *
 * Reading cookies (as the SSR `server.ts` client does) forces a route into
 * dynamic rendering, which would defeat static prerendering + ISR for the public
 * blog/content pages. This client carries no session and touches no cookies, so
 * pages that read only published content stay statically generatable. RLS
 * (`content_items_read_published`) already restricts anon access to published
 * rows, so no session is needed.
 *
 * Reads that must include drafts (admin/preview) keep the cookie-bound client.
 */
export function createPublicClient() {
  return createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
