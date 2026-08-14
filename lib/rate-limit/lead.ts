import 'server-only';
import { createHash } from 'node:crypto';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

// Fixed fallback salt for environments that haven't set LEAD_RATE_LIMIT_SALT
// (local dev, the memory-limiter path with no Supabase). It's public (it's
// right here in source), so it adds no real secrecy -- production Supabase
// mode should set a real per-deploy salt via the env var.
const DEV_SALT = 'sitekit-dev-salt';

export function hashIp(ip: string): string {
  const salt = env.leadRateLimitSalt() ?? DEV_SALT;
  return createHash('sha256').update(salt).update('|').update(ip).digest('hex');
}

export function extractIpFromHeaders(h: Headers): string | null {
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = h.get('x-real-ip');
  return real?.trim() || null;
}

/**
 * 'allowed'/'limited' distinguish a normal rate-limit decision; 'error' means
 * the RPC itself failed (e.g. the migration that creates
 * `try_record_lead_attempt` was never applied) and no decision could be
 * made at all. Callers must not treat 'error' as either allowed or limited:
 * collapsing it to "limited" silently fake-succeeds every enquiry with no
 * signal that the CMS is misconfigured (a misconfigured Supabase project
 * would silently eat every lead), and collapsing it to "allowed" would
 * defeat rate limiting entirely on every RPC hiccup.
 */
export async function checkAndRecordAttempt(
  ipHash: string,
  maxPerHour = 5,
): Promise<'allowed' | 'limited' | 'error'> {
  const sb = createAdminClient();
  const { data, error } = await sb.rpc('try_record_lead_attempt', {
    p_ip_hash: ipHash,
    p_max: maxPerHour,
    p_window: '1 hour',
  });
  if (error) {
    console.error('rate_limit.rpc_failed — check Supabase migrations', error.message);
    return 'error';
  }
  return data === true ? 'allowed' : 'limited';
}
