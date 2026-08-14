// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { customSections } from '@/components/sections/custom';
import { renderSections } from '@/components/sections/registry';
import { validateSiteConfig } from '@/lib/config/validate';
import { site } from '@/site.config';

afterEach(cleanup);

const configuredCustomKeys = site.sections
  .filter(key => key.startsWith('custom:'))
  .map(key => key.slice('custom:'.length));

describe('custom section registry', () => {
  it('has a module for every custom key in site.sections', () => {
    for (const name of configuredCustomKeys) {
      expect(customSections[name], `custom:${name} has no module in components/sections/custom`).toBeDefined();
    }
  });

  it('validates the copy shipped in site.config for every configured module', () => {
    for (const name of configuredCustomKeys) {
      expect(() => customSections[name].validateCopy(site.copy.custom?.[name])).not.toThrow();
    }
  });

  it('rejects malformed copy with a message naming the field', () => {
    expect(() => customSections.halionHero.validateCopy({})).toThrow(/copy\.custom\.halionHero/);
    expect(() => customSections.halionProjects.validateCopy({ eyebrow: 'x', heading: 'x', sub: 'x', projects: [] }))
      .toThrow(/projects must be a non-empty array/);
  });
});

describe('renderSections with custom keys', () => {
  it('renders a custom section from config copy', () => {
    render(<>{renderSections(['custom:halionProjects'], site.copy)}</>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Each project is a living experiment.');
    expect(screen.getByRole('heading', { name: 'Mosaic' })).toBeInTheDocument();
  });

  it('throws a clear error for an unregistered custom key', () => {
    expect(() => render(<>{renderSections(['custom:doesNotExist'], site.copy)}</>))
      .toThrow(/Unknown custom section "custom:doesNotExist"/);
  });
});

describe('config validation for custom sections', () => {
  it('accepts the live site config', () => {
    expect(() => validateSiteConfig(site)).not.toThrow();
  });

  it('rejects a custom key with no matching copy.custom entry', () => {
    const bad = { ...site, sections: ['custom:missing'] as typeof site.sections };
    expect(() => validateSiteConfig(bad)).toThrow(/copy\.custom\.missing/);
  });

  it('rejects an empty custom name', () => {
    const bad = { ...site, sections: ['custom:'] as typeof site.sections };
    expect(() => validateSiteConfig(bad)).toThrow(/expected "custom:<name>"/);
  });
});
