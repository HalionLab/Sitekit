import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';
import { disabledResponse, features } from '@/lib/config/features';
import { themeColors } from '@/lib/theme';
import { site } from '@/site.config';

/**
 * Per-source unsubscribe endpoint.
 *
 * GET  -- human clicks the email footer link: verify, suppress, branded
 *         HTML confirmation.
 * POST -- RFC 8058 one-click unsubscribe (Gmail / Apple Mail hit this via
 *         the List-Unsubscribe-Post header): verify, suppress, bare 200.
 *
 * Suppression is pair-wide: every lead row matching the signed row's
 * (email, source) is marked, so duplicate signups can't resurrect a stream.
 * The update is idempotent -- already-suppressed rows keep their original
 * opt-out timestamp.
 */
async function suppress(
  leadId: string | null,
  token: string | null,
): Promise<{ ok: boolean; status: number }> {
  if (!leadId || !token || !verifyUnsubscribeToken(leadId, token)) {
    return { ok: false, status: 400 };
  }

  const sb = createAdminClient();
  const { data: lead, error: lookupError } = await sb
    .from('leads')
    .select('email, source')
    .eq('id', leadId)
    .maybeSingle();
  if (lookupError || !lead) return { ok: false, status: 404 };

  // Pair-wide, idempotent suppression:
  //   update leads set unsubscribed_at = now()
  //    where email = $1 and source = $2 and unsubscribed_at is null
  const { error: updateError } = await sb
    .from('leads')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', lead.email)
    .eq('source', lead.source)
    .is('unsubscribed_at', null);
  if (updateError) {
    console.error('unsubscribe.update_failed', updateError.message);
    return { ok: false, status: 500 };
  }

  return { ok: true, status: 200 };
}

const CONFIRMATION_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribed</title></head>
<body style="margin:0;background:${themeColors.surface};color:${themeColors.fg};font-family:Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="text-align:center;padding:24px">
    <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${themeColors.accent};margin:0">${site.name}</p>
    <h1 style="font-size:28px;margin:16px 0 8px">You&rsquo;re unsubscribed.</h1>
    <p style="color:${themeColors.fgMuted};margin:0">This email stream won&rsquo;t be sent to you again.</p>
  </div>
</body>
</html>`;

export async function GET(request: NextRequest) {
  if (!features.cms) return disabledResponse();

  const { searchParams } = request.nextUrl;
  const result = await suppress(searchParams.get('lead'), searchParams.get('token'));
  if (!result.ok) {
    return new Response('Invalid or expired unsubscribe link.', { status: result.status });
  }
  return new Response(CONFIRMATION_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  if (!features.cms) return disabledResponse();

  const { searchParams } = request.nextUrl;
  const result = await suppress(searchParams.get('lead'), searchParams.get('token'));
  return new Response(null, { status: result.status });
}
