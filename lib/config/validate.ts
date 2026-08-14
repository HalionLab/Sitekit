import type { SectionKey, SiteConfig } from './types';

/** Every valid section key, in no particular order. */
export const ALL_SECTION_KEYS: SectionKey[] = [
  'hero', 'servicesGrid', 'about', 'testimonials', 'gallery', 'faq',
  'pricing', 'contactBand', 'teamGrid', 'processSteps', 'statsBand',
  'logoStrip', 'ctaBand', 'hoursMap', 'blogTeaser',
];

/**
 * Sections whose copy comes entirely from config (`copy.<key>`) and must be
 * present when the section is listed. The remaining sections
 * (`servicesGrid`, `contactBand`, `hoursMap`, `blogTeaser`) have full
 * defaults derived from `business`/other content sources, so copy is
 * optional for them.
 */
export const SECTIONS_REQUIRING_COPY: SectionKey[] = [
  'hero', 'about', 'testimonials', 'gallery', 'faq',
  'pricing', 'teamGrid', 'processSteps', 'statsBand', 'logoStrip', 'ctaBand',
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const GA4_SITE_ID_RE = /^G-[A-Z0-9]+$/;

function fail(message: string): never {
  throw new Error(`site.config.ts: ${message}`);
}

/**
 * Hand-rolled validator for the site config singleton. Throws on the first
 * violation found; every message is prefixed `site.config.ts: ` and names
 * the offending field so wizard/setup errors are actionable.
 */
export function validateSiteConfig(config: SiteConfig): void {
  if (!config.name || !config.name.trim()) fail('name must be a non-empty string');
  if (!config.tagline || !config.tagline.trim()) fail('tagline must be a non-empty string');
  if (!config.description || !config.description.trim()) fail('description must be a non-empty string');

  if (!config.url || !config.url.trim()) {
    fail('url must be a non-empty string');
  }
  try {
    void new URL(config.url);
  } catch {
    fail(`url is not a valid URL: "${config.url}"`);
  }

  if (!config.business) fail('business is required');
  if (!config.business.email || !EMAIL_RE.test(config.business.email)) {
    fail(`business.email is not a valid email: "${config.business.email}"`);
  }
  if (!config.business.phone || !config.business.phone.trim()) {
    fail('business.phone must be a non-empty string');
  }

  for (const key of config.sections) {
    if (!ALL_SECTION_KEYS.includes(key)) {
      fail(`unknown section key in sections: "${key}"`);
    }
  }

  for (const key of config.sections) {
    if (SECTIONS_REQUIRING_COPY.includes(key) && !config.copy[key]) {
      fail(`section "${key}" is listed in sections but has no matching copy.${key} entry (${key} requires copy)`);
    }
  }

  if (config.features.gatedDownload && !config.features.cms) {
    fail('features.gatedDownload requires features.cms');
  }

  if (config.features.analytics && config.analytics.provider !== 'none') {
    if (!config.analytics.siteId || !config.analytics.siteId.trim()) {
      fail(`analytics.siteId is required when features.analytics is true and provider is "${config.analytics.provider}"`);
    }
    if (config.analytics.provider === 'umami' && (!config.analytics.scriptUrl || !config.analytics.scriptUrl.trim())) {
      fail('analytics.scriptUrl is required when analytics.provider is "umami"');
    }
    if (config.analytics.provider === 'ga4' && !GA4_SITE_ID_RE.test(config.analytics.siteId ?? '')) {
      fail(`analytics.siteId must match the GA4 measurement ID format "G-XXXXXXX" when analytics.provider is "ga4" (got "${config.analytics.siteId}")`);
    }
  }

  if (config.sections.includes('blogTeaser') && !config.features.blog) {
    fail('section "blogTeaser" is listed in sections but features.blog is false');
  }
}
