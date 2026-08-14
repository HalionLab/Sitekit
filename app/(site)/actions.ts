'use server';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { isValidEmail } from '@/lib/validation/email';
import { hashIp, extractIpFromHeaders, checkAndRecordAttempt } from '@/lib/rate-limit/lead';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email/send';
import { getCurrentDownload, downloadPublicUrl } from '@/lib/downloads/queries';
import { site } from '@/site.config';

const VALID_SOURCES = ['download', 'newsletter', 'quote', 'contact'] as const;
type Source = (typeof VALID_SOURCES)[number];

export async function submitLead(input: {
  email: string;
  source: string;
  honeypot: string;
}): Promise<{ ok: true; downloadUrl?: string } | { ok: false; error: string }> {
  // Supabase-mode only. LeadCaptureForm (this action's only caller) is
  // rendered by CMS-mode sections; this is belt-and-suspenders in case it's
  // ever reached with `features.cms` off (file mode has no `leads` table
  // client to write to).
  if (!site.features.cms) {
    return { ok: false, error: 'Not available.' };
  }

  // Honeypot: a real user never fills the off-screen `company` field. If it's
  // populated, silently succeed without writing anything — the bot believes it
  // worked and we never learn we were probed.
  if (input.honeypot && input.honeypot.length > 0) {
    return { ok: true };
  }

  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: 'Please enter a valid email.' };

  const source: Source | 'other' = VALID_SOURCES.includes(input.source as Source)
    ? (input.source as Source)
    : 'other';

  const h = await headers();
  const ip = extractIpFromHeaders(h) ?? '0.0.0.0';
  const ipHash = hashIp(ip);

  const rateLimitResult = await checkAndRecordAttempt(ipHash, 5);
  if (rateLimitResult === 'error') {
    // The rate-limit RPC itself failed (most likely a missing migration).
    // Never fake a success here -- that would silently swallow every lead
    // with no signal to the site owner that anything is wrong.
    return { ok: false, error: 'Something went wrong. Try again.' };
  }
  if (rateLimitResult === 'limited') {
    // Rate limited. Return a generic success so we never reveal the limit or its
    // specifics to an attacker. Log server-side (hash prefix only, never the IP
    // or the full hash) so we can still see it happening.
    console.warn('lead.rate_limited', { source, ipHashPrefix: ipHash.slice(0, 8) });
    return { ok: true };
  }

  const ua = h.get('user-agent')?.slice(0, 300) ?? null;
  const sb = createAdminClient();
  const { data: inserted, error } = await sb
    .from('leads')
    .insert({
      email,
      source,
      ip_hash: ipHash,
      user_agent: ua,
    })
    .select('id')
    .single();
  if (error) {
    // Log the Supabase error message only (never the client or env). Return a
    // generic message to the user.
    console.error('lead.insert_failed', error.message);
    return { ok: false, error: 'Something went wrong. Try again.' };
  }

  // Resolve the current download's public URL for the instant link + email
  // CTA. download only -- newsletter/quote/contact have nothing to hand back.
  // Resolved server-side here so the response carries it (instant access, no
  // waiting). A resolve failure must never fail the capture, so it degrades
  // to no link.
  let downloadUrl: string | null = null;
  if (source === 'download') {
    try {
      const item = await getCurrentDownload();
      downloadUrl = item ? downloadPublicUrl(item.storage_path) : null;
    } catch (err) {
      console.error('lead.download_resolve_failed', err instanceof Error ? err.message : 'unknown');
    }
  }

  // Welcome email goes out after the response is sent -- it never delays or
  // fails the submission. Honeypot and rate-limited requests return earlier, so
  // only real inserts reach this point. The resolved downloadUrl (or null) is
  // threaded through so the email CTA links to the actual PDF, not a fallback.
  after(() => sendWelcomeEmail(inserted.id, email, source, downloadUrl));

  return { ok: true, downloadUrl: downloadUrl ?? undefined };
}
