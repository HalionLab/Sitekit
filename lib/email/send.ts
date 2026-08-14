import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { SITE, absoluteUrl } from '@/lib/seo/site';
import { createAdminClient } from '@/lib/supabase/admin';
import { unsubscribeUrl } from './unsubscribe-token';
import { WelcomeEmail } from './welcome';

/**
 * The sending identity. Falls back to Resend's shared sandbox address, which
 * works with no domain verification -- override with RESEND_FROM once a
 * sending domain is verified in the Resend dashboard (it is a property of
 * the Resend account, not of the deploy URL, so it isn't derived from
 * env.siteUrl()).
 */
const FROM = `${SITE.name} <${env.resendFrom() ?? 'onboarding@resend.dev'}>`;

/**
 * Sends the post-signup welcome email. Designed to run inside next/server's
 * after() from the lead-capture action:
 *
 * - Never throws: any failure (missing key, Resend error, network) is logged
 *   and swallowed. The lead row is already inserted by the time this runs.
 * - Skips silently when RESEND_API_KEY is unset, so environments without the
 *   key (local dev, CI) keep working.
 * - Per-source suppression: if this (email, source) pair has ever opted out,
 *   nothing is sent. Fails closed if the check itself errors.
 */
export async function sendWelcomeEmail(
  leadId: string,
  to: string,
  source: string,
  downloadUrl: string | null,
): Promise<void> {
  try {
    const apiKey = env.resendApiKey();
    if (!apiKey) {
      console.warn('email.skipped_no_api_key', { source });
      return;
    }

    // Per-source suppression check:
    //   select id from leads
    //    where email = $1 and source = $2 and unsubscribed_at is not null
    //    limit 1
    const sb = createAdminClient();
    const { data: optedOut, error: suppressionError } = await sb
      .from('leads')
      .select('id')
      .eq('email', to)
      .eq('source', source)
      .not('unsubscribed_at', 'is', null)
      .limit(1);
    if (suppressionError) {
      // Fail closed: if consent can't be verified, don't send.
      console.error('email.suppression_check_failed', suppressionError.message);
      return;
    }
    if (optedOut && optedOut.length > 0) {
      console.warn('email.skipped_unsubscribed', { source });
      return;
    }

    // Atomic dedup claim: stamp THIS lead row only if no (email, source) sibling
    // has already been welcomed. The partial unique index
    // leads_one_welcome_per_pair (0001_init.sql) is the serialization point --
    // a second concurrent claim for the pair fails with 23505, so exactly one
    // send wins. A failed Resend send below releases the claim so a later
    // submit retries.
    const { data: claimed, error: claimError } = await sb
      .from('leads')
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq('id', leadId)
      .is('welcome_sent_at', null)
      .select('id');
    if (claimError) {
      if (claimError.code === '23505') {
        console.warn('email.skipped_already_welcomed', { source });
      } else {
        console.error('email.claim_failed', claimError.message);
      }
      return;
    }
    if (!claimed || claimed.length === 0) {
      // Row already stamped (e.g. a duplicate after() run) -- already handled.
      console.warn('email.skipped_already_claimed', { source });
      return;
    }

    const unsubscribe = unsubscribeUrl(leadId);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject:
        source === 'download'
          ? `Your download from ${SITE.name}`
          : `Welcome to ${SITE.name}`,
      // The resolved current-download URL when present (download path);
      // otherwise fall back to the site homepage.
      react: WelcomeEmail({
        source,
        downloadUrl: downloadUrl ?? absoluteUrl('/'),
        unsubscribeUrl: unsubscribe,
      }),
      headers: {
        'List-Unsubscribe': `<${unsubscribe}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      // Release the claim so a future submit can retry this (email, source).
      await sb.from('leads').update({ welcome_sent_at: null }).eq('id', leadId);
      // Resend returns errors in the result rather than throwing.
      console.error('email.send_failed', { name: error.name, message: error.message });
    }
  } catch (err) {
    console.error(
      'email.send_threw',
      err instanceof Error ? err.message : 'unknown error',
    );
  }
}
