import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Reads the public env vars via STATIC
 * `process.env.NEXT_PUBLIC_*` access on purpose: Next only inlines these into
 * the client bundle when the key is a literal. The `lib/env` helper reads
 * `process.env[name]` with a dynamic key, which the compiler cannot inline, so
 * the values would be undefined in the browser. (Server-side clients can use
 * the helper freely — this constraint is client-bundle-specific.)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
