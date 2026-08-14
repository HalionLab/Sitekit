import Script from 'next/script';
import { site } from '@/site.config';

/**
 * Config-driven analytics loader. Provider and IDs come entirely from
 * `site.config.ts` (`features.analytics` + `analytics`); there is no env
 * var to set. Renders nothing when analytics is off or the provider is
 * "none" -- the validator (lib/config/validate.ts) already guarantees
 * siteId/scriptUrl are present whenever a real provider is selected (and,
 * for ga4, that siteId matches the `G-XXXX` measurement-ID shape), so no
 * defensive checks are needed here beyond the early-out.
 *
 * GA4's siteId is still escaped before going into the inline init script
 * below (see `escapeForInlineScript`), as defense in depth: the validator
 * only runs against the checked-in site.config.ts, and Task 15's setup
 * wizard writes siteId from free-text wizard input before that file is
 * re-validated. An inline `<script>` is a "raw text" HTML element -- during
 * server-side HTML serialization a literal `</script>` substring inside it
 * closes the tag early regardless of JS-string quoting, the same hazard
 * JsonLd (components/seo/JsonLd.tsx) guards against for JSON-LD payloads.
 *
 * GA4 note: this only loads gtag.js and fires a page-view config call. Any
 * cookie/consent banner, consent-mode defaults, or region-specific gating
 * required by law is the site owner's responsibility to add -- see
 * AGENTS.md (documented alongside the rest of the compliance surface in
 * Task 18).
 */

/**
 * Quote a value as a JS string literal safe to splice into an inline
 * `<script>` body: JSON.stringify handles quote/backslash/control-char
 * escaping, then `<` is escaped to `<` so a `</script>` substring
 * (e.g. from a hostile siteId) can never appear literally in the output
 * and prematurely close the tag during HTML serialization.
 */
function escapeForInlineScript(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function Analytics() {
  if (!site.features.analytics || site.analytics.provider === 'none') {
    return null;
  }

  const { provider, siteId, scriptUrl } = site.analytics;

  if (provider === 'plausible') {
    return (
      <Script
        src={scriptUrl ?? 'https://plausible.io/js/script.js'}
        data-domain={siteId}
        strategy="afterInteractive"
      />
    );
  }

  if (provider === 'umami') {
    return <Script src={scriptUrl} data-website-id={siteId} strategy="afterInteractive" />;
  }

  if (provider === 'ga4') {
    const safeSiteId = escapeForInlineScript(siteId ?? '');
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(siteId ?? '')}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${safeSiteId});`}
        </Script>
      </>
    );
  }

  return null;
}
