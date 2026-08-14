'use client';
import { createClient } from '@/lib/supabase/client';
import { createDownloadUploadUrl } from '@/app/admin/downloads/actions';
import { validatePdfFile } from '@/lib/admin/download-upload';

/**
 * Browser-side download-PDF upload. Mirrors lib/admin/upload-client.ts but
 * targets the `downloads` bucket and carries the item label (the label forms
 * the storage key, so it must be known before the signed URL is minted).
 *
 * Flow: client pre-validate -> createDownloadUploadUrl (auth + server
 * re-validate + signed token) -> uploadToSignedUrl -> return the bare
 * storage key for download_items.storage_path.
 */
export async function uploadDownloadPdf(
  file: File,
  label: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  // 1. Client-side pre-validation (fast feedback before any network call).
  const validation = validatePdfFile({ type: file.type, size: file.size });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  // 2. Request a signed upload token (server gates auth + re-validates).
  const result = await createDownloadUploadUrl({
    filename: file.name,
    contentType: file.type,
    size: file.size,
    label,
  });
  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Upload failed.' };
  }

  // 3. Upload the file via the signed URL.
  const { error } = await createClient()
    .storage
    .from('downloads')
    .uploadToSignedUrl(result.path!, result.token!, file, { contentType: file.type });
  if (error) {
    console.error('download.upload_failed', error);
    return { ok: false, error: 'Upload failed. Please try again.' };
  }

  // 4. Return the bare storage key (no 'downloads/' prefix).
  return { ok: true, path: result.path! };
}
