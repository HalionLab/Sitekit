import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/seo/site';
import { features } from '@/lib/config/features';

/**
 * Paths that should never be crawled. '/api/' and '/preview' (the section
 * kitchen sink) are always disallowed. The admin surface, auth flows, and
 * the unsubscribe endpoint only exist when `cms` is on (see
 * `lib/config/features.ts` gating), so they're only listed here in that case
 * -- no point disallowing a path that already 404s. '/admin' is deliberately
 * slash-less so the admin landing page itself is blocked, not just its
 * children.
 */
const DISALLOWED_PATHS = [
  '/api/',
  '/preview',
  ...(features.cms ? ['/admin', '/auth/', '/unsubscribe'] : []),
];

/**
 * Major AI crawlers get an explicit rule granting the same access as everyone
 * else. We want this content findable and citable by AI assistants; the
 * explicit entries make that intent unambiguous and survive any future
 * tightening of the wildcard rule.
 */
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
