// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { customSections, defineCustomSection } from '@/components/sections/custom';
import { renderSections } from '@/components/sections/registry';
import { validateSiteConfig } from '@/lib/config/validate';
import { site } from '@/site.config';
import { asRecord, reqString } from '@/components/sections/custom/copy-utils';

// A throwaway module injected into the (mutable) registry per test, so the
// mechanism is exercised independently of whatever sections this site ships.
const testBand = defineCustomSection<{ heading: string }>({
  Component: ({ copy }) => <section><h2>{copy.heading}</h2></section>,
  validateCopy(raw) {
    const o = asRecord('testBand', raw);
    return { heading: reqString('testBand', o, 'heading') };
  },
});

afterEach(() => {
  delete customSections.testBand;
  cleanup();
});

const configuredCustomKeys = site.sections
  .filter(key => key.startsWith('custom:'))
  .map(key => key.slice('custom:'.length));

describe('custom section mechanism', () => {
  it('renders a registered custom section from copy.custom', () => {
    customSections.testBand = testBand;
    render(<>{renderSections(['custom:testBand'], { custom: { testBand: { heading: 'Escape hatch works' } } })}</>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Escape hatch works');
  });

  it('throws a clear error for an unregistered custom key', () => {
    expect(() => render(<>{renderSections(['custom:doesNotExist'], site.copy)}</>))
      .toThrow(/Unknown custom section "custom:doesNotExist"/);
  });

  it('surfaces validateCopy failures with the field named', () => {
    customSections.testBand = testBand;
    expect(() => render(<>{renderSections(['custom:testBand'], { custom: { testBand: {} } })}</>))
      .toThrow(/copy\.custom\.testBand: heading/);
  });
});

describe('this site’s custom sections', () => {
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

  it('renders a custom section from config copy', () => {
    render(<>{renderSections(['custom:halionProjects'], site.copy)}</>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Each project is a living experiment.');
    expect(screen.getByRole('heading', { name: 'Mosaic' })).toBeInTheDocument();
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

  it('accepts a custom key when copy.custom carries it', () => {
    const ok = {
      ...site,
      sections: ['custom:anything'] as typeof site.sections,
      copy: { ...site.copy, custom: { ...site.copy.custom, anything: { heading: 'x' } } },
    };
    expect(() => validateSiteConfig(ok)).not.toThrow();
  });
});
