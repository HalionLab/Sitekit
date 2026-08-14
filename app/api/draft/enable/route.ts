import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { disabledResponse, features } from '@/lib/config/features';
import {
  getPageBySlugIncludingDrafts,
  getPostBySlugIncludingDrafts,
} from '@/lib/content/queries';

/**
 * Enables Next.js Draft Mode and redirects to the target content.
 *
 * Usage: /api/draft/enable?slug=<slug>&type=<post|page>  (type defaults to post)
 *
 * Admin-gated: requireAdmin() must pass before anything else runs; failures
 * return a bare 404 so the route leaks no signal about its existence or the
 * session state.
 *
 * The redirect path is built from the database row (kind + slug), never from
 * raw query input, so the route cannot be used as an open redirect.
 */
export async function GET(request: NextRequest) {
  if (!features.cms) return disabledResponse();

  try {
    await requireAdmin();
  } catch {
    return new Response(null, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') ?? 'post';

  if (!slug || (type !== 'post' && type !== 'page')) {
    return new Response('Expected ?slug=<slug>&type=<post|page>', { status: 400 });
  }

  const item =
    type === 'page'
      ? await getPageBySlugIncludingDrafts(slug)
      : await getPostBySlugIncludingDrafts(slug);
  if (!item) {
    return new Response('No such content', { status: 404 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(item.kind === 'page' ? `/${item.slug}` : `/blog/${item.slug}`);
}
