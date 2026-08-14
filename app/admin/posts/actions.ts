'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { validateContentInput } from '@/lib/admin/content';
import { validateImageFile, buildUploadPath } from '@/lib/admin/upload';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Shared state shape (useActionState-compatible)
// ---------------------------------------------------------------------------

export interface ContentActionState {
  ok: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Image upload token
// ---------------------------------------------------------------------------

export interface ImageUploadUrlResult {
  ok: boolean;
  error: string | null;
  path?: string;
  token?: string;
}

export async function createImageUploadUrl(
  input: { filename: string; contentType: string; size: number },
): Promise<ImageUploadUrlResult> {
  // 1. Auth gate — nothing runs before this
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }

  // 2. Validate file type + size before issuing any token
  const validation = validateImageFile({ type: input.contentType, size: input.size });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  // 3. Build collision-resistant storage key
  const path = buildUploadPath(input.filename);

  // 4. Request a signed upload URL from Supabase Storage
  const { data, error } = await createAdminClient()
    .storage
    .from('media')
    .createSignedUploadUrl(path);

  if (error) {
    console.error('admin.upload_url_failed', error.message);
    return { ok: false, error: 'Could not start the upload. Please try again.' };
  }

  // 5. Return path + token only (client calls uploadToSignedUrl with these)
  return { ok: true, error: null, path: data.path, token: data.token };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Translate a Supabase / Postgres error into a user-facing message. */
function mapDbError(error: { code?: string; message?: string }): string {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  // Unique violation on (kind, slug)
  if (code === '23505') {
    return 'That slug is already in use.';
  }

  // Reserved-slug trigger raises with errcode 'check_violation' (SQLSTATE 23514)
  // and a message containing "reserved" (see 0002_reserved_slugs.sql).
  // The trigger uses RAISE EXCEPTION ... USING errcode = 'check_violation',
  // which forces SQLSTATE 23514 (not the default P0001).
  if (code === '23514' && msg.includes('reserved')) {
    return 'That slug is reserved and cannot be used.';
  }

  return '';
}

function publicPath(kind: string, slug: string): string {
  return kind === 'post' ? `/blog/${slug}` : `/${slug}`;
}

// ---------------------------------------------------------------------------
// savePost
// ---------------------------------------------------------------------------

export async function savePost(
  prevState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  // 1. Auth gate
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }

  // 2. Validate input
  const result = validateContentInput(formData);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const data = result.data;

  // 3. Derive DB status
  // RLS gates public visibility on status = 'published', so setting status:
  // 'draft' on unpublish is sufficient to hide the post — published_at is
  // preserved so the original publication date is retained if re-published.
  const status = data.intent === 'publish' ? 'published' : 'draft';

  const sb = createAdminClient();

  // 4a. INSERT (new post)
  if (data.id === null) {
    const published_at =
      data.intent === 'publish' ? new Date().toISOString() : undefined;

    const { error } = await sb.from('content_items').insert({
      kind: data.kind,
      slug: data.slug,
      title: data.title,
      body_markdown: data.body_markdown,
      excerpt: data.excerpt,
      cover_image_path: data.cover_image_path,
      cover_image_alt: data.cover_image_alt,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      status,
      ...(published_at !== undefined ? { published_at } : {}),
    });

    if (error) {
      const friendly = mapDbError(error);
      if (friendly) return { ok: false, error: friendly };
      console.error('admin.save_failed', error.message);
      return { ok: false, error: 'Could not save. Please try again.' };
    }

    // Revalidate
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    revalidatePath(publicPath(data.kind, data.slug));
  } else {
    // 4b. UPDATE — fetch existing row first for published_at rule + old-slug revalidation
    const { data: existing, error: fetchError } = await sb
      .from('content_items')
      .select('id, kind, slug, published_at')
      .eq('id', data.id)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: 'Post not found.' };
    }

    // published_at rule: set only on first publish; never clear on draft/unpublish
    let published_at: string | undefined = existing.published_at ?? undefined;
    if (data.intent === 'publish' && !existing.published_at) {
      published_at = new Date().toISOString();
    }

    const { error } = await sb
      .from('content_items')
      .update({
        kind: data.kind,
        slug: data.slug,
        title: data.title,
        body_markdown: data.body_markdown,
        excerpt: data.excerpt,
        cover_image_path: data.cover_image_path,
        cover_image_alt: data.cover_image_alt,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        status,
        ...(published_at !== undefined ? { published_at } : {}),
      })
      .eq('id', data.id);

    if (error) {
      const friendly = mapDbError(error);
      if (friendly) return { ok: false, error: friendly };
      console.error('admin.save_failed', error.message);
      return { ok: false, error: 'Could not save. Please try again.' };
    }

    // Revalidate
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    revalidatePath(publicPath(data.kind, data.slug));
    // Always bust the row's previous public URL too: covers both slug changes
    // and kind changes (post <-> page), and is a no-op when neither changed.
    revalidatePath(publicPath(existing.kind, existing.slug));
  }

  // 5. Redirect — must be outside the try/catch that maps DB errors.
  // Kind-aware so the page editor returns to /admin/pages, not /admin/posts.
  redirect(data.kind === 'page' ? '/admin/pages' : '/admin/posts');
}

// ---------------------------------------------------------------------------
// deletePost
// ---------------------------------------------------------------------------

export async function deletePost(
  prevState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  // 1. Auth gate
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Not authorized.' };
  }

  // 2. Read id
  const id = (formData.get('id') as string | null)?.trim() ?? '';
  if (!id) {
    return { ok: false, error: 'Missing post id.' };
  }

  const sb = createAdminClient();

  // 3. Fetch row for revalidation paths
  const { data: existing, error: fetchError } = await sb
    .from('content_items')
    .select('kind, slug')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: 'Post not found.' };
  }

  // 4. Delete
  const { error } = await sb.from('content_items').delete().eq('id', id);

  if (error) {
    console.error('admin.delete_failed', error.message);
    return { ok: false, error: 'Could not delete. Please try again.' };
  }

  // 5. Revalidate
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath(publicPath(existing.kind, existing.slug));

  // 6. Redirect — outside error-handling path.
  // Kind-aware so deleting a page returns to /admin/pages, not /admin/posts.
  redirect(existing.kind === 'page' ? '/admin/pages' : '/admin/posts');
}
