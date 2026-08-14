import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DownloadItem {
  id: string;
  label: string;
  storage_path: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * The single current download item, or null if none is marked current.
 *
 * Service-role read: `download_items` is RLS-locked to the service role (no
 * anon/authenticated policies, see 0001_init.sql). The public site resolves
 * the current item here, server-side, and only ever exposes the resolved
 * public URL -- never the table itself. The partial unique index guarantees
 * at most one current row, so maybeSingle() is safe.
 */
export async function getCurrentDownload(): Promise<DownloadItem | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('download_items')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();
  if (error) throw new Error(`getCurrentDownload: ${error.message}`);
  return (data as DownloadItem | null) ?? null;
}

/**
 * Admin-only: every download item, newest first. Service-role read
 * (RLS-locked table). Caller must have already verified admin status.
 */
export async function getAllDownloadItems(): Promise<DownloadItem[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('download_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`getAllDownloadItems: ${error.message}`);
  return (data ?? []) as DownloadItem[];
}

/**
 * Public, shareable URL for a download key in the `downloads` bucket.
 *
 * The bucket is public=true, so this direct-object URL serves without auth
 * (shareable on purpose); it is not enumerable (no anon list policy). Mirrors
 * lib/content/media.ts `mediaUrl`. Reads NEXT_PUBLIC_SUPABASE_URL via STATIC
 * access so it is inlineable everywhere, though today it is only consumed
 * server-side (the lead action + the email). Returns null for a null/empty
 * key or when the URL env var is unset.
 */
export function downloadPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/downloads/${path.replace(/^downloads\//, '')}`;
}
