'use server';
import { headers } from 'next/headers';
import { hashIp, extractIpFromHeaders } from '@/lib/rate-limit/lead';
import { leadSink, checkEnquiryRateLimit, validateEnquiryInput } from '@/lib/leads';
import type { EnquirySource } from '@/lib/leads/types';

const VALID_SOURCES: EnquirySource[] = ['contact', 'quote', 'newsletter', 'download', 'other'];

export async function submitEnquiry(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  honeypot: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Honeypot: a real user never fills the off-screen `company` field. If
  // it's populated, silently succeed without writing anything or touching
  // the rate limiter -- the bot believes it worked and we never learn we
  // were probed.
  if (input.honeypot && input.honeypot.length > 0) {
    return { ok: true };
  }

  const validated = validateEnquiryInput(input);
  if (!validated.ok) return { ok: false, error: validated.error };

  const h = await headers();
  const ip = extractIpFromHeaders(h) ?? '0.0.0.0';
  const ipHash = hashIp(ip);

  const rateLimitResult = await checkEnquiryRateLimit(ipHash);
  if (rateLimitResult === 'error') {
    // The rate-limit RPC itself failed (most likely a missing migration).
    // Never fake a success here -- that would silently swallow every
    // enquiry with no signal to the site owner that anything is wrong.
    return { ok: false, error: 'Something went wrong. Try again.' };
  }
  if (rateLimitResult === 'limited') {
    // Rate limited. Return a generic success so we never reveal the limit or
    // its specifics to an attacker. Log server-side (hash prefix only, never
    // the IP or the full hash) so we can still see it happening.
    console.warn('enquiry.rate_limited', { ipHashPrefix: ipHash.slice(0, 8) });
    return { ok: true };
  }

  const source: EnquirySource = VALID_SOURCES.includes(input.source as EnquirySource)
    ? (input.source as EnquirySource)
    : 'contact';

  const ua = h.get('user-agent')?.slice(0, 300) ?? null;

  const result = await leadSink.capture({ ...validated.value, source, userAgent: ua });

  if (!result.ok) {
    if (result.reason === 'unconfigured') {
      // A novice's contact form must never error just because Resend isn't
      // configured yet -- degrade to a success and log loudly so it's
      // obvious in the server log what to fix.
      console.warn('enquiry.unconfigured — set RESEND_API_KEY');
      return { ok: true };
    }
    console.error('enquiry.capture_failed', { reason: result.reason });
    return { ok: false, error: 'Something went wrong. Try again.' };
  }

  return { ok: true };
}
