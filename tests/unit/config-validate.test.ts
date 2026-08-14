import { describe, it, expect } from 'vitest';
import { validateSiteConfig } from '@/lib/config/validate';
import { site } from '@/site.config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deep clone for targeted, ad-hoc field mutation across many test cases
const base = () => structuredClone(site) as any;

describe('validateSiteConfig', () => {
  it('accepts the shipped default config', () => {
    expect(() => validateSiteConfig(site)).not.toThrow();
  });
  it('rejects empty name', () => {
    const c = base(); c.name = '';
    expect(() => validateSiteConfig(c)).toThrow(/name/);
  });
  it('rejects gatedDownload without cms', () => {
    const c = base(); c.features.cms = false; c.features.gatedDownload = true;
    expect(() => validateSiteConfig(c)).toThrow(/gatedDownload requires features.cms/);
  });
  it('rejects unknown section keys', () => {
    const c = base(); c.sections.push('bogus');
    expect(() => validateSiteConfig(c)).toThrow(/unknown section/i);
  });
  it('rejects a section listed without copy when copy is required', () => {
    // Force the condition rather than assuming the shipped config lists 'hero'
    // (rebrand-proof: custom-section configs may not use the built-in hero).
    const c = base(); c.sections = ['hero']; c.copy.hero = undefined;
    expect(() => validateSiteConfig(c)).toThrow(/hero.*copy/i);
  });
  it('rejects analytics provider with missing siteId', () => {
    const c = base(); c.features.analytics = true;
    c.analytics = { provider: 'plausible' };
    expect(() => validateSiteConfig(c)).toThrow(/siteId/);
  });
  it('rejects a ga4 siteId that does not match the G-XXXX measurement ID format', () => {
    const c = base(); c.features.analytics = true;
    c.analytics = { provider: 'ga4', siteId: "G-X'</script><script>alert(1)" };
    expect(() => validateSiteConfig(c)).toThrow(/measurement ID format/);
  });
  it('accepts a well-formed ga4 measurement ID', () => {
    const c = base(); c.features.analytics = true;
    c.analytics = { provider: 'ga4', siteId: 'G-ABC1234' };
    expect(() => validateSiteConfig(c)).not.toThrow();
  });
  it('rejects malformed business email', () => {
    const c = base(); c.business.email = 'not-an-email';
    expect(() => validateSiteConfig(c)).toThrow(/email/);
  });
});
