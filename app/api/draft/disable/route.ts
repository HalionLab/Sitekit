import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { disabledResponse, features } from '@/lib/config/features';

/**
 * Clears the Draft Mode cookie and returns home.
 *
 * Deliberately NOT admin-gated: it only deletes the requester's own bypass
 * cookie, and gating it would strand an admin whose session expired while
 * previewing. Links to this route must use prefetch={false} so the cookie
 * isn't cleared by a hover prefetch. Still feature-gated: with `cms` off
 * there is no draft mode to disable.
 */
export async function GET() {
  if (!features.cms) return disabledResponse();

  const draft = await draftMode();
  draft.disable();
  redirect('/');
}
