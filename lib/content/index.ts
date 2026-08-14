import 'server-only';
import { site } from '@/site.config';
import { createFileSource } from './sources/file';
import { createSupabaseSource } from './sources/supabase';
import type { ContentSource } from './types';

/**
 * Adapter selection. A static import of the Supabase source is safe with no
 * env vars set: `createPublicClient`/`createAdminClient` (and the `env.*`
 * helpers they call) only touch `process.env` inside function bodies, which
 * run lazily -- nothing at module-evaluation time reads an env var. `npm run
 * build` with zero env vars is the proof; see task-5 verification.
 *
 * File mode is the default (`site.features.cms === false`), and stays the
 * fallback even when `cms` is on but Supabase isn't configured yet, so a
 * fresh clone never hard-fails on a missing `NEXT_PUBLIC_SUPABASE_URL`.
 */
function select(): ContentSource {
  if (site.features.cms && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createSupabaseSource();
  }
  return createFileSource();
}

export const contentSource: ContentSource = select();
export type { ContentSource, Page, Post, SitemapEntry } from './types';
