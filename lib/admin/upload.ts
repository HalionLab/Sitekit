/**
 * Pure image-upload validation helpers — no env access, no server-only imports.
 *
 * This module is intentionally free of side-effects so it can be imported by:
 *   - A Next.js server action (lib/admin/actions/upload-action.ts)
 *   - A client-side file-picker component for instant feedback before upload
 *
 * Defense-in-depth note: the limits here are the first gate — friendly errors
 * shown to the user. supabase/migrations/0005_harden_media_bucket.sql mirrors
 * these same constraints at the bucket level (file_size_limit + allowed_mime_types)
 * as a server-side backstop that holds even if an upload somehow bypasses this
 * app-level check.
 */

// ---------------------------------------------------------------------------
// Allowed types + size cap
// ---------------------------------------------------------------------------

/**
 * The four MIME types accepted for media uploads.
 *
 * Keep conceptually in sync with the `allowed_mime_types` array in
 * supabase/migrations/0005_harden_media_bucket.sql — both lists must match.
 */
export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const);

/**
 * 5 MB in bytes.  Must equal `file_size_limit = 5242880` in
 * supabase/migrations/0005_harden_media_bucket.sql.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 242 880

// ---------------------------------------------------------------------------
// validateImageFile
// ---------------------------------------------------------------------------

export type ImageFileValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Validates that a file is an accepted image type and within the size limit.
 *
 * Takes a plain `{ type, size }` object so it works equally well for a browser
 * `File` (pass `{ type: file.type, size: file.size }`) and for a server-side
 * check on a raw buffer — no dependency on the `File` class.
 *
 * Validation order:
 *   1. size ≤ 0  → "No file selected."   (nothing to validate)
 *   2. bad type  → friendly type error    (type check before size check —
 *                                          the error message for a huge SVG
 *                                          should be about the type, not size)
 *   3. too large → friendly size error
 */
export function validateImageFile(input: { type: string; size: number }): ImageFileValidationResult {
  if (input.size <= 0) {
    return { ok: false, error: 'No file selected.' };
  }

  if (!ALLOWED_IMAGE_TYPES.has(input.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif')) {
    return { ok: false, error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' };
  }

  if (input.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image is too large. Maximum size is 5 MB.' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// buildUploadPath
// ---------------------------------------------------------------------------

/**
 * Produces a collision-resistant, URL-safe storage path for a media upload.
 *
 * Format: `uploads/<timestamp>-<sanitized-base>.<ext>`
 *
 * Rules:
 *   - Extension: the segment after the last `.`, lowercased.  If there is no
 *     `.` the extension is an empty string (edge case; MIME validation should
 *     have already run).
 *   - Base sanitization: lowercase → collapse every run of non-`[a-z0-9]`
 *     chars into a single `-` → strip leading/trailing `-`.  An empty result
 *     falls back to `"image"`.
 *   - Timestamp: `Date.now()` ms since epoch; fine for a module called at
 *     request time (not a workflow / test harness script).
 *   - No leading `media/` — consumers prepend the bucket prefix as needed.
 *   - No leading slash.
 *
 * MIME-level validation (type/size) is handled separately by validateImageFile;
 * this function does not re-validate.
 */
export function buildUploadPath(filename: string): string {
  const lastDot = filename.lastIndexOf('.');

  let rawBase: string;
  let ext: string;

  if (lastDot === -1) {
    // No extension at all (e.g. "photoname")
    rawBase = filename;
    ext = '';
  } else {
    rawBase = filename.slice(0, lastDot);
    ext = filename.slice(lastDot + 1).toLowerCase();
  }

  // Sanitize the base: lowercase, collapse non-alphanum runs to '-', trim '-'
  const safeBase =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image';

  const timestamp = Date.now();

  return ext
    ? `uploads/${timestamp}-${safeBase}.${ext}`
    : `uploads/${timestamp}-${safeBase}`;
}
