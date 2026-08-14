import { env } from '@/lib/env';
import { site } from '@/site.config';
import type { DayKey } from '@/lib/config/types';

/** Brand-level constants shared by metadata, JSON-LD, and llms.txt. */
export const SITE = {
  name: site.name,
  tagline: site.tagline,
};

/**
 * Absolute site origin with no trailing slash, e.g. `https://example.com`.
 * Falls back to the config's `url`, then localhost, so builds without
 * NEXT_PUBLIC_SITE_URL (fresh clones, CI without env) don't throw; production
 * always has the var set.
 */
export function siteOrigin(): string {
  try {
    return env.siteUrl().replace(/\/$/, '');
  } catch {
    return (site.url || 'http://localhost:3000').replace(/\/$/, '');
  }
}

/** Resolve a site-relative path to an absolute URL on the canonical origin. */
export function absoluteUrl(path = '/'): string {
  return `${siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Base openGraph fields for per-route metadata.
 *
 * Next's metadata merging is shallow: any route segment that defines
 * `openGraph` replaces the inherited object entirely (siteName, locale, and
 * images included). Every per-route openGraph must therefore spread this base
 * first, then override what it needs.
 *
 * The image URL is relative; the root layout's `metadataBase` resolves it to
 * an absolute URL. `/opengraph-image` is the generated brand fallback image
 * (app/opengraph-image.tsx).
 */
export const sharedOpenGraph = {
  siteName: SITE.name,
  locale: 'en_US',
  images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: SITE.name }],
};

const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/** Zero-pads an "H:MM" or "HH:MM" clock time to "HH:MM". */
function padClock(time: string): string {
  const [h, m = '00'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

/**
 * Maps `site.business.hours` (e.g. `{ mon: '8:00-17:00', sun: 'closed' }`)
 * to schema.org `OpeningHoursSpecification` entries for LocalBusiness
 * JSON-LD. Days marked `'closed'` are omitted entirely (schema.org has no
 * "closed" value — absence is how you express it).
 */
export function openingHours(
  hours: Record<DayKey, string>,
): { '@type': 'OpeningHoursSpecification'; dayOfWeek: string; opens: string; closes: string }[] {
  return (Object.keys(hours) as DayKey[])
    .filter(day => hours[day] !== 'closed')
    .map(day => {
      const [opens, closes] = hours[day].split('-');
      return {
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: DAY_NAMES[day],
        opens: padClock(opens),
        closes: padClock(closes),
      };
    });
}
