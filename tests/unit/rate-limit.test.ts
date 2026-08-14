import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hashIp, extractIpFromHeaders, checkAndRecordAttempt } from '@/lib/rate-limit/lead';

const mockRpc = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
}));

describe('hashIp', () => {
  beforeEach(() => { process.env.LEAD_RATE_LIMIT_SALT = 'test-salt-32-bytes-hex-or-equivalent'; });
  it('returns the same hash for the same IP', () => {
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'));
  });
  it('returns different hashes for different IPs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('5.6.7.8'));
  });
  it('produces a hex string of length 64', () => {
    expect(hashIp('1.2.3.4')).toMatch(/^[0-9a-f]{64}$/);
  });
  it('changes when the salt changes', () => {
    const a = hashIp('1.2.3.4');
    process.env.LEAD_RATE_LIMIT_SALT = 'different-salt';
    expect(hashIp('1.2.3.4')).not.toBe(a);
  });
});

describe('hashIp with no salt configured', () => {
  const original = process.env.LEAD_RATE_LIMIT_SALT;

  beforeEach(() => {
    delete process.env.LEAD_RATE_LIMIT_SALT;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.LEAD_RATE_LIMIT_SALT;
    else process.env.LEAD_RATE_LIMIT_SALT = original;
  });

  it('does not throw and falls back to a fixed dev salt', () => {
    expect(() => hashIp('1.2.3.4')).not.toThrow();
    expect(hashIp('1.2.3.4')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same hash as an explicit "sitekit-dev-salt"', () => {
    const withoutSalt = hashIp('1.2.3.4');
    process.env.LEAD_RATE_LIMIT_SALT = 'sitekit-dev-salt';
    expect(hashIp('1.2.3.4')).toBe(withoutSalt);
  });
});

describe('extractIpFromHeaders', () => {
  it('uses the first entry of x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' });
    expect(extractIpFromHeaders(h)).toBe('203.0.113.5');
  });
  it('falls back to x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '198.51.100.7' });
    expect(extractIpFromHeaders(h)).toBe('198.51.100.7');
  });
  it('returns null if neither is present', () => {
    expect(extractIpFromHeaders(new Headers())).toBe(null);
  });
});

describe('checkAndRecordAttempt', () => {
  const errorSpy = () => vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('returns "allowed" when the RPC succeeds and reports the caller under the limit', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    expect(await checkAndRecordAttempt('deadbeef', 5)).toBe('allowed');
  });

  it('returns "limited" when the RPC succeeds but reports the caller over the limit', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    expect(await checkAndRecordAttempt('deadbeef', 5)).toBe('limited');
  });

  it('returns "error" (never "allowed" or "limited") when the RPC itself fails, and logs loudly', async () => {
    const spy = errorSpy();
    mockRpc.mockResolvedValue({ data: null, error: { message: 'function try_record_lead_attempt does not exist' } });
    const result = await checkAndRecordAttempt('deadbeef', 5);
    expect(result).toBe('error');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('rate_limit.rpc_failed'),
      expect.stringContaining('does not exist'),
    );
    spy.mockRestore();
  });

  it('passes the ip hash, max, and a 1-hour window through to the RPC', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    await checkAndRecordAttempt('deadbeef', 7);
    expect(mockRpc).toHaveBeenCalledWith('try_record_lead_attempt', {
      p_ip_hash: 'deadbeef',
      p_max: 7,
      p_window: '1 hour',
    });
  });
});
