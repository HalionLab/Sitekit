/**
 * Resolve a content media key (e.g. `cover.png` or `media/cover.png`) to a
 * public Supabase Storage URL. Returns `null` for a null/empty key, or when the
 * Supabase URL env var is unset (so callers can render-or-omit without throwing).
 *
 * Reads `process.env.NEXT_PUBLIC_SUPABASE_URL` via STATIC access on purpose:
 * this runs in client components too (e.g. the admin CoverImageField preview),
 * and Next only inlines the value into the client bundle for a literal key. The
 * `lib/env` helper reads `process.env[name]` dynamically, which the compiler
 * cannot inline, so it would be undefined in the browser. (Same constraint as
 * `lib/supabase/client.ts`.)
 *
 * For free-form image `src` values inside rendered markdown bodies, see the
 * pass-through resolver in `lib/markdown/render.tsx`, which has different
 * semantics (absolute/root-relative URLs pass through untouched).
 */
export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${path.replace(/^media\//, '')}`;
}
