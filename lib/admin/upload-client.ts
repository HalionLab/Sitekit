'use client';
import { createClient } from '@/lib/supabase/client';
import { createImageUploadUrl } from '@/app/admin/posts/actions';
import { validateImageFile } from '@/lib/admin/upload';

/**
 * Browser-side image upload helper.
 *
 * Flow:
 *   1. Client-side pre-validation via validateImageFile (fast fail, friendly UX).
 *      The server action re-validates; this is defence-in-depth.
 *   2. Call the createImageUploadUrl server action to get a signed upload token.
 *   3. PUT the file to Supabase Storage via uploadToSignedUrl.
 *   4. Return the bare storage path (e.g. `uploads/1234567890-my-cover.png`),
 *      which is what gets stored in cover_image_path.
 */
export async function uploadImage(
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  // 1. Client-side pre-validation (fast feedback before any network call)
  const validation = validateImageFile({ type: file.type, size: file.size });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  // 2. Request a signed upload token from the server
  const result = await createImageUploadUrl({
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Upload failed.' };
  }

  // 3. Upload the file using the signed URL token
  // uploadToSignedUrl(path, token, fileBody, fileOptions?)
  const { error } = await createClient()
    .storage
    .from('media')
    .uploadToSignedUrl(result.path!, result.token!, file, {
      contentType: file.type,
    });

  if (error) {
    console.error('upload.failed', error);
    return { ok: false, error: 'Upload failed. Please try again.' };
  }

  // 4. Return the bare storage path (no leading 'media/' prefix)
  return { ok: true, path: result.path! };
}
