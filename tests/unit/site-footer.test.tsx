// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

const baseConfig = {
  name: 'Acme',
  tagline: 'We fix things.',
  copy: {},
  business: {
    legalName: 'Acme LLC',
    phone: '+1-555-010-0100',
    email: 'hello@acme.test',
    address: { street: '1 Main St', city: 'Denver', region: 'CO', postalCode: '80216', country: 'US' },
    serviceAreas: ['Denver', 'Aurora'],
  },
  footerLinks: [
    { href: '/blog', label: 'Blog' },
    { href: '/blog/foo', label: 'Blog Foo' },
    { href: '/contact', label: 'Contact' },
  ],
  social: {},
};

afterEach(() => {
  cleanup();
  vi.resetModules();
});

/**
 * Mirrors the pre-T9 `FooterCTA` link filtering (task 6 review finding),
 * carried forward onto `SiteFooter`: footerLinks pointing at `/blog`-prefixed
 * routes must disappear when `features.blog` is off, since those routes 404
 * when the flag is off.
 */
describe('SiteFooter link filtering', () => {
  it('hides /blog-prefixed footerLinks when features.blog is false', async () => {
    vi.doMock('@/site.config', () => ({
      site: { ...baseConfig, features: { blog: false, cms: false, gatedDownload: false, analytics: false } },
    }));
    const { SiteFooter } = await import('@/components/layout/SiteFooter');
    const { container } = render(<SiteFooter />);
    const hrefs = [...container.querySelectorAll('nav[aria-label="Footer"] a')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/contact']);
  });

  it('keeps /blog-prefixed footerLinks when features.blog is true', async () => {
    vi.doMock('@/site.config', () => ({
      site: { ...baseConfig, features: { blog: true, cms: false, gatedDownload: false, analytics: false } },
    }));
    const { SiteFooter } = await import('@/components/layout/SiteFooter');
    const { container } = render(<SiteFooter />);
    const hrefs = [...container.querySelectorAll('nav[aria-label="Footer"] a')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/blog', '/blog/foo', '/contact']);
  });
});
