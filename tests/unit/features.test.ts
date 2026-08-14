import { describe, it, expect, vi } from 'vitest';

vi.mock('@/site.config', () => ({
  site: { features: { cms: false, blog: false, gatedDownload: false, analytics: false } },
}));

describe('features', () => {
  it('notFoundUnless throws when the flag is off', async () => {
    const { notFoundUnless, features } = await import('@/lib/config/features');
    // Next's notFound() throws a NEXT_HTTP_ERROR_FALLBACK digest error --
    // assert on throwing, not on message text.
    expect(() => notFoundUnless(features.cms)).toThrow();
    expect(() => notFoundUnless(features.blog)).toThrow();
  });

  it('notFoundUnless does not throw when the flag is on', async () => {
    const { notFoundUnless } = await import('@/lib/config/features');
    expect(() => notFoundUnless(true)).not.toThrow();
  });

  it('disabledResponse returns a 404 Response', async () => {
    const { disabledResponse } = await import('@/lib/config/features');
    const res = disabledResponse();
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(404);
  });
});
