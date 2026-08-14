// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { customSections, defineCustomSection } from '@/components/sections/custom';
import { renderSections } from '@/components/sections/registry';
import { validateSiteConfig } from '@/lib/config/validate';
import { site } from '@/site.config';
import { asRecord, reqString } from '@/components/sections/custom/copy-utils';

// A throwaway module injected into the (mutable) registry per test — the
// template ships the registry empty, so the mechanism is exercised with a
// fixture rather than a shipped section.
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

describe('custom section mechanism', () => {
  it('renders a registered custom section from copy.custom', () => {
    customSections.testBand = testBand;
    render(<>{renderSections(['custom:testBand'], { custom: { testBand: { heading: 'Escape hatch works' } } })}</>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Escape hatch works');
  });

  it('throws a clear error for an unregistered custom key', () => {
    expect(() => render(<>{renderSections(['custom:doesNotExist'], {})}</>))
      .toThrow(/Unknown custom section "custom:doesNotExist"/);
  });

  it('surfaces validateCopy failures with the field named', () => {
    customSections.testBand = testBand;
    expect(() => render(<>{renderSections(['custom:testBand'], { custom: { testBand: {} } })}</>))
      .toThrow(/copy\.custom\.testBand: heading/);
  });

  it('every custom key in the shipped config has a module and valid copy', () => {
    // Vacuously true for the template (no custom sections); real sites that
    // add custom keys get coverage automatically.
    for (const key of site.sections.filter(k => k.startsWith('custom:'))) {
      const name = key.slice('custom:'.length);
      expect(customSections[name], `custom:${name} has no module`).toBeDefined();
      expect(() => customSections[name].validateCopy(site.copy.custom?.[name])).not.toThrow();
    }
  });
});

describe('config validation for custom sections', () => {
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
      copy: { ...site.copy, custom: { anything: { heading: 'x' } } },
    };
    expect(() => validateSiteConfig(ok)).not.toThrow();
  });
});
