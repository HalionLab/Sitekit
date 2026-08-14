'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePdfFile, buildDownloadPath } from '@/lib/admin/download-upload';

export interface DownloadActionResult {
  ok: boolean;
  error: string | null;
}

export interface DownloadUploadUrlResult {
  ok: boolean;
  error: string | null;
  path?: string;
  token?: string;
}

// ---------------------------------------------------------------------------
// createDownloadUploadUrl — the write-side auth surface.
// Order is deliberate and mirrors createImageUploadUrl: AUTH GATE first, then
// validate the file, then (and only then) mint a signed upload URL. Nothing
// touches storage before requireAdmin passes.
// ---------------------------------------------------------------------------
export async function createDownloadUploadUrl(input: {
  filename: string;
  contentType: string;
  size: number;
  label: string;
}): Promise<DownloadUploadUrlResult> {
  // 1. Auth gate — nothing runs before this.
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }

  // 2. Validate the file (type + size) before issuing any token.
  const validation = validatePdfFile({ type: input.contentType, size: input.size });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  // 3. Label is required — it forms the storage key and the item's name.
  const label = input.label.trim();
  if (!label) {
    return { ok: false, error: 'Add a label before uploading.' };
  }

  // 4. Build the non-guessable key, then request a signed upload URL.
  const path = buildDownloadPath(label);
  const { data, error } = await createAdminClient()
    .storage
    .from('downloads')
    .createSignedUploadUrl(path);

  if (error) {
    console.error('downloads.upload_url_failed', error.message);
    return { ok: false, error: 'Could not start the upload. Please try again.' };
  }

  return { ok: true, error: null, path: data.path, token: data.token };
}

// ---------------------------------------------------------------------------
// flipCurrent — clear-then-set the single current item.
// NOT exported. Caller must have already passed requireAdmin.
//
// Clear FIRST so the partial unique index (one row WHERE is_current) can never
// block the set. There is a brief zero-current window between the two
// statements; if the SET fails we do NOT swallow it — a single-admin setup
// silently left with no live download is the bad case, so we log loudly and
// surface an actionable error.
// ---------------------------------------------------------------------------
async function flipCurrent(
  sb: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<DownloadActionResult> {
  const { error: clearError } = await sb
    .from('download_items')
    .update({ is_current: false })
    .eq('is_current', true);
  if (clearError) {
    console.error('downloads.clear_current_failed', clearError.message);
    return { ok: false, error: 'Could not update the current item. Please try again.' };
  }

  // RETURNING the row so a no-op (bad/missing id) is detected — otherwise the
  // clear above would have left ZERO current silently.
  const { data: setRows, error: setError } = await sb
    .from('download_items')
    .update({ is_current: true })
    .eq('id', id)
    .select('id');
  if (setError || !setRows || setRows.length === 0) {
    console.error('downloads.set_current_failed', {
      id,
      message: setError?.message ?? 'no row matched id (zero-current state)',
    });
    return {
      ok: false,
      error: 'Failed to mark the item current — no download is live right now. Please retry.',
    };
  }
  return { ok: true, error: null };
}

// ---------------------------------------------------------------------------
// saveDownloadItem — insert a new item, optionally make it current.
// ---------------------------------------------------------------------------
export async function saveDownloadItem(input: {
  label: string;
  storagePath: string;
  makeCurrent: boolean;
}): Promise<DownloadActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }

  const label = input.label.trim();
  const storagePath = input.storagePath.trim();
  if (!label) return { ok: false, error: 'Label is required.' };
  if (!storagePath) return { ok: false, error: 'Upload a PDF before saving.' };

  const sb = createAdminClient();
  const { data: inserted, error } = await sb
    .from('download_items')
    .insert({ label, storage_path: storagePath })
    .select('id')
    .single();
  if (error || !inserted) {
    console.error('downloads.save_failed', error?.message ?? 'no row returned');
    return { ok: false, error: 'Could not save the item. Please try again.' };
  }

  if (input.makeCurrent) {
    const flip = await flipCurrent(sb, inserted.id);
    // Current state changed (or was attempted) either way — refresh the landing.
    revalidatePath('/');
    revalidatePath('/admin/downloads');
    return flip.ok ? { ok: true, error: null } : flip;
  }

  revalidatePath('/admin/downloads');
  return { ok: true, error: null };
}

// ---------------------------------------------------------------------------
// setCurrentDownload — mark an existing item current (the per-row "Mark current").
// ---------------------------------------------------------------------------
export async function setCurrentDownload(id: string): Promise<DownloadActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }
  if (!id?.trim()) return { ok: false, error: 'Missing item id.' };

  const sb = createAdminClient();
  const flip = await flipCurrent(sb, id.trim());

  // Landing label + resolved current download change when the current flips.
  revalidatePath('/');
  revalidatePath('/admin/downloads');
  return flip;
}

// ---------------------------------------------------------------------------
// deleteDownloadItem — remove a non-current item (row first, then object).
// ---------------------------------------------------------------------------
export async function deleteDownloadItem(id: string): Promise<DownloadActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }
  if (!id?.trim()) return { ok: false, error: 'Missing item id.' };

  const sb = createAdminClient();

  // Fetch first: need storage_path to remove the object, is_current to guard.
  const { data: row, error: fetchError } = await sb
    .from('download_items')
    .select('id, storage_path, is_current')
    .eq('id', id.trim())
    .maybeSingle();
  if (fetchError) {
    console.error('downloads.delete_fetch_failed', fetchError.message);
    return { ok: false, error: 'Could not delete the item. Please try again.' };
  }
  if (!row) return { ok: false, error: 'Item not found.' };

  // Guard: deleting the current item unpublishes the live download. Block it —
  // the admin must mark another item current first.
  if (row.is_current) {
    return {
      ok: false,
      error: 'This is the current item. Mark another item current before deleting it.',
    };
  }

  // Delete the ROW first: a later storage failure then leaves a harmless orphan
  // file, never a row pointing at a missing PDF.
  const { error: delError } = await sb.from('download_items').delete().eq('id', row.id);
  if (delError) {
    console.error('downloads.delete_failed', delError.message);
    return { ok: false, error: 'Could not delete the item. Please try again.' };
  }

  // Remove the storage object by its exact tracked key (never list()). Non-fatal:
  // the row (source of truth) is already gone; an orphan file is logged only.
  const { error: storageError } = await sb.storage.from('downloads').remove([row.storage_path]);
  if (storageError) {
    console.warn('downloads.delete_orphaned_object', {
      key: row.storage_path,
      message: storageError.message,
    });
  }

  revalidatePath('/admin/downloads');
  return { ok: true, error: null };
}
