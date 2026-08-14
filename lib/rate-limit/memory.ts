/**
 * In-process, per-instance rate limiter -- the fallback for sites running
 * without Supabase configured (no durable ledger available). Not shared
 * across serverless instances or restarts, so it's a soft backstop rather
 * than a hard guarantee; sites that need the real thing should turn on
 * `features.cms` (Supabase mode), which uses the RPC-backed ledger instead.
 */
export function createMemoryLimiter(max: number, windowMs: number): (key: string) => boolean {
  const hits = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const cutoff = now - windowMs;

    const existing = hits.get(key) ?? [];
    const pruned = existing.filter(ts => ts > cutoff);

    if (pruned.length >= max) {
      // Still prune-and-store so a key that's blocked for a long time
      // doesn't hold on to timestamps far outside the window forever.
      hits.set(key, pruned);
      return false;
    }

    pruned.push(now);
    hits.set(key, pruned);
    return true;
  };
}

/** Default shared instance: 5 attempts per hour, keyed by hashed IP. */
const defaultLimiter = createMemoryLimiter(5, 60 * 60 * 1000);
export default defaultLimiter;
