/**
 * Top-level segments that have their own routes (or are reserved for future
 * ones). A published content page must never hijack these, even though Next's
 * static segments already take routing precedence over the dynamic [slug]
 * segment. The sitemap uses the same set so it never lists a slug the [slug]
 * route would refuse to render.
 *
 * This is the routing-level guard; the database keeps its own (wider) list in
 * the reserved_slugs table and blocks reserved slugs at insert/update time.
 */
export const RESERVED_SLUGS = new Set([
  'blog',
  'admin',
  'api',
  'auth',
  'login',
  'llms.txt',
  'opengraph-image',
  'unsubscribe',
  'contact',
  'privacy',
  'terms',
  'preview',
]);
