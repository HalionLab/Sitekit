import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryLimiter } from '@/lib/rate-limit/memory';

describe('createMemoryLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to max attempts within the window', () => {
    const limiter = createMemoryLimiter(3, 1000);
    expect(limiter('a')).toBe(true);
    expect(limiter('a')).toBe(true);
    expect(limiter('a')).toBe(true);
  });

  it('blocks the 4th attempt within the window', () => {
    const limiter = createMemoryLimiter(3, 1000);
    limiter('a');
    limiter('a');
    limiter('a');
    expect(limiter('a')).toBe(false);
  });

  it('allows again once the window has elapsed', () => {
    const limiter = createMemoryLimiter(3, 1000);
    limiter('a');
    limiter('a');
    limiter('a');
    expect(limiter('a')).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter('a')).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = createMemoryLimiter(1, 1000);
    expect(limiter('a')).toBe(true);
    expect(limiter('b')).toBe(true);
    expect(limiter('a')).toBe(false);
  });

  it('prunes stale timestamps so a key does not leak memory forever', () => {
    const limiter = createMemoryLimiter(2, 1000);
    limiter('a');
    limiter('a');
    expect(limiter('a')).toBe(false);

    vi.advanceTimersByTime(1500);

    // Only the two calls inside the new window should count.
    expect(limiter('a')).toBe(true);
    expect(limiter('a')).toBe(true);
    expect(limiter('a')).toBe(false);
  });
});
