// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.resetModules();
});

/**
 * next/script passthrough: render a plain <script> with the same props so
 * jsdom queries (`container.querySelectorAll('script')`) can inspect
 * data-* attributes and src the way they'd inspect the real emitted tag.
 * Real next/script defers actual injection to the browser; that behavior
 * isn't what this component is responsible for -- it only needs to prove
 * it picks the right shape and props per provider.
 */
vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => {
    const { children, dangerouslySetInnerHTML, ...rest } = props as {
      children?: string;
      dangerouslySetInnerHTML?: { __html: string };
      [key: string]: unknown;
    };
    return dangerouslySetInnerHTML
      ? <script {...rest} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script {...rest}>{children}</script>;
  },
}));

describe('Analytics', () => {
  it('renders nothing when features.analytics is false', async () => {
    vi.doMock('@/site.config', () => ({
      site: { features: { analytics: false }, analytics: { provider: 'plausible', siteId: 'example.com' } },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    expect(container.querySelectorAll('script')).toHaveLength(0);
  });

  it('renders nothing when provider is "none"', async () => {
    vi.doMock('@/site.config', () => ({
      site: { features: { analytics: true }, analytics: { provider: 'none' } },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    expect(container.querySelectorAll('script')).toHaveLength(0);
  });

  it('renders a plausible script with data-domain and the default script src', async () => {
    vi.doMock('@/site.config', () => ({
      site: { features: { analytics: true }, analytics: { provider: 'plausible', siteId: 'example.com' } },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('data-domain')).toBe('example.com');
    expect(scripts[0].getAttribute('src')).toBe('https://plausible.io/js/script.js');
  });

  it('renders a plausible script with a custom scriptUrl when provided', async () => {
    vi.doMock('@/site.config', () => ({
      site: {
        features: { analytics: true },
        analytics: { provider: 'plausible', siteId: 'example.com', scriptUrl: 'https://analytics.example.com/js/script.js' },
      },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('src')).toBe('https://analytics.example.com/js/script.js');
  });

  it('renders a umami script with data-website-id and the required scriptUrl', async () => {
    vi.doMock('@/site.config', () => ({
      site: {
        features: { analytics: true },
        analytics: { provider: 'umami', siteId: 'abc-123', scriptUrl: 'https://umami.example.com/script.js' },
      },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('data-website-id')).toBe('abc-123');
    expect(scripts[0].getAttribute('src')).toBe('https://umami.example.com/script.js');
  });

  it('renders two ga4 scripts: a gtag loader with the id and an inline init', async () => {
    vi.doMock('@/site.config', () => ({
      site: { features: { analytics: true }, analytics: { provider: 'ga4', siteId: 'G-ABC123' } },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(2);
    const loader = scripts[0];
    expect(loader.getAttribute('src')).toContain('https://www.googletagmanager.com/gtag/js?id=G-ABC123');
    const inline = scripts[1];
    expect(inline.innerHTML).toContain('gtag');
    expect(inline.innerHTML).toContain('G-ABC123');
  });

  /**
   * Defense in depth: lib/config/validate.ts now rejects any ga4 siteId
   * that isn't shaped like `G-XXXX` (see tests/unit/config-validate.test.ts
   * "rejects a ga4 siteId that does not match..."), but that validator only
   * runs against the checked-in site.config.ts -- Task 15's setup wizard
   * writes siteId from free-text input before that file is re-validated.
   * Mock site.config directly here (bypassing the validator, same as every
   * other case in this file) to prove the component's own escaping holds
   * even if a hostile value ever reaches it.
   */
  it('escapes a hostile ga4 siteId so it cannot break out of the inline script', async () => {
    const hostile = "G-X'</script><script>alert(1)";
    vi.doMock('@/site.config', () => ({
      site: { features: { analytics: true }, analytics: { provider: 'ga4', siteId: hostile } },
    }));
    const { Analytics } = await import('@/components/Analytics');
    const { container } = render(<Analytics />);
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(2);
    const inline = scripts[1].textContent ?? '';
    // A raw "</script>" substring would close the tag early during HTML
    // serialization, regardless of JS-string quoting around it.
    expect(inline).not.toContain('</script>');
    // The id must appear as a properly quoted, unicode-escaped JS string
    // literal -- not a raw interpolation an attacker's quote could break.
    expect(inline).toContain(JSON.stringify(hostile).replace(/</g, '\\u003c'));
  });
});
