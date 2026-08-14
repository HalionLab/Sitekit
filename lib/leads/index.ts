import 'server-only';
import { site } from '@/site.config';
import { isValidEmail } from '@/lib/validation/email';
import { checkAndRecordAttempt } from '@/lib/rate-limit/lead';
import { createMemoryLimiter } from '@/lib/rate-limit/memory';
import { emailSink } from './sinks/email';
import { supabaseSink } from './sinks/supabase';
import type { LeadSink } from './types';

/**
 * Sink selection. A static import of the Supabase sink is safe with no env
 * vars set -- `createAdminClient`/`env.*` only touch `process.env` inside
 * function bodies, which run lazily. Mirrors `lib/content/index.ts`'s
 * selection: email is the default (`site.features.cms === false`), and
 * stays the fallback even when `cms` is on but Supabase isn't configured
 * yet, so a fresh clone never hard-fails on a missing
 * `NEXT_PUBLIC_SUPABASE_URL`.
 */
const useSupabase = site.features.cms && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export const leadSink: LeadSink = useSupabase ? supabaseSink : emailSink;

/** Same 5-per-hour policy either way; only the ledger backing it changes. */
const memoryLimiter = createMemoryLimiter(5, 60 * 60 * 1000);

/**
 * Rate-limit check shared by every submit action that captures a lead. Uses
 * the durable Supabase RPC ledger in CMS mode (shared across instances) and
 * the in-process memory limiter otherwise (no DB configured).
 *
 * The memory limiter can't fail the way an RPC can, so it only ever
 * produces 'allowed'/'limited'; 'error' is exclusive to the Supabase path
 * and must propagate to the caller rather than being swallowed here -- see
 * checkAndRecordAttempt's doc comment for why.
 */
export async function checkEnquiryRateLimit(ipHash: string): Promise<'allowed' | 'limited' | 'error'> {
  if (useSupabase) {
    return checkAndRecordAttempt(ipHash, 5);
  }
  return memoryLimiter(ipHash) ? 'allowed' : 'limited';
}

export interface ValidatedEnquiryInput {
  email: string;
  name?: string;
  phone?: string;
  message?: string;
}

/**
 * Validation shared by every submit action that captures a lead (the
 * contact form today; a future quote form or newsletter box tomorrow).
 * Trims/normalizes fields and enforces the same limits regardless of which
 * form or sink is behind it. Does not check the honeypot -- callers check
 * that first and return a silent success without reaching validation.
 */
export function validateEnquiryInput(input: {
  name?: string;
  email: string;
  phone?: string;
  message?: string;
}): { ok: true; value: ValidatedEnquiryInput } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Please enter a valid email.' };
  }

  const name = input.name?.trim() || undefined;
  if (name && name.length > 120) {
    return { ok: false, error: 'Name is too long.' };
  }

  const message = input.message?.trim() || undefined;
  if (message && message.length > 2000) {
    return { ok: false, error: 'Message is too long.' };
  }

  const phone = input.phone?.trim() || undefined;

  return { ok: true, value: { email, name, phone, message } };
}
