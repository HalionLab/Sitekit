import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { siteOrigin } from '@/lib/seo/site';

/**
 * Unsubscribe link tokens: HMAC-SHA256 over the lead row id. The id (a UUID)
 * is what travels in the URL -- never the email address -- and the signature
 * proves the link came from us without any DB state.
 */
export function unsubscribeToken(leadId: string): string {
  return createHmac('sha256', env.unsubscribeSecret()).update(leadId).digest('hex');
}

/** Constant-time verification; returns false for malformed input. */
export function verifyUnsubscribeToken(leadId: string, token: string): boolean {
  const expected = unsubscribeToken(leadId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/** Absolute unsubscribe URL used in the email footer and List-Unsubscribe header. */
export function unsubscribeUrl(leadId: string): string {
  return `${siteOrigin()}/unsubscribe?lead=${leadId}&token=${unsubscribeToken(leadId)}`;
}
