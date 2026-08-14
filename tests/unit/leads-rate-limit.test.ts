import { describe, it, expect } from 'vitest';
import { checkEnquiryRateLimit } from '@/lib/leads';

/**
 * site.config.ts ships with `features.cms: false`, so `checkEnquiryRateLimit`
 * resolves to the in-process memory limiter in this test environment (the
 * Supabase RPC path is covered directly by
 * tests/unit/rate-limit.test.ts's checkAndRecordAttempt suite). The memory
 * limiter can never fail the way an RPC can, so it should only ever produce
 * 'allowed'/'limited', never 'error'.
 */
describe('checkEnquiryRateLimit (memory-limiter path, cms disabled)', () => {
  it('returns "allowed" for a key under the limit', async () => {
    const key = `key-${Math.random()}`;
    expect(await checkEnquiryRateLimit(key)).toBe('allowed');
  });

  it('returns "limited" once a key exceeds 5 attempts in the window', async () => {
    const key = `key-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(await checkEnquiryRateLimit(key)).toBe('allowed');
    }
    expect(await checkEnquiryRateLimit(key)).toBe('limited');
  });
});
