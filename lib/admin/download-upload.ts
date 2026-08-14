/**
 * Pure download-PDF upload validation helpers -- no env access, no
 * server-only imports, so this can be imported by both the admin server
 * action and a client-side file picker (instant feedback before upload).
 * Mirrors the image equivalents in lib/admin/upload.ts.
 *
 * Defense-in-depth: the limits here are the friendly first gate; the
 * `downloads` bucket in supabase/migrations/0001_init.sql mirrors them at the
 * bucket level (file_size_limit + allowed_mime_types) as a server-side
 * backstop.
 */
import { deriveSlug } from '@/lib/admin/content';

/** Only application/pdf is accepted for download items. */
export const DOWNLOAD_MIME = 'application/pdf';

/**
 * 25 MB in bytes. Must equal `file_size_limit = 26214400` in
 * supabase/migrations/0001_init.sql (the `downloads` bucket).
 */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 26 214 400

export type PdfFileValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Validates that a file is a PDF within the size limit. Takes a plain
 * `{ type, size }` so it works for a browser `File` and a server-side check
 * alike. Order: empty -> type -> size (so a huge non-PDF reports the type, not
 * the size).
 */
export function validatePdfFile(input: { type: string; size: number }): PdfFileValidationResult {
  if (input.size <= 0) {
    return { ok: false, error: 'No file selected.' };
  }
  if (input.type !== DOWNLOAD_MIME) {
    return { ok: false, error: 'Unsupported file type. Upload a PDF.' };
  }
  if (input.size > MAX_DOWNLOAD_BYTES) {
    return { ok: false, error: 'PDF is too large. Maximum size is 25 MB.' };
  }
  return { ok: true };
}

/**
 * Collision-resistant, non-guessable storage key for a download item:
 *   `<random-token>-<label-slug>.pdf`
 *
 * The random token keeps the public (shareable) URL stable yet unguessable, so
 * the downloads bucket can't be walked by incrementing labels -- the other
 * half of "shareable on purpose, not enumerable" (the first half being the
 * bucket's absent list policy). PDF-only, so the extension is fixed. No
 * bucket prefix and no leading slash: the caller targets the `downloads`
 * bucket.
 */
export function buildDownloadPath(label: string): string {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const slug = deriveSlug(label) || 'download';
  return `${token}-${slug}.pdf`;
}
