import { describe, it, expect } from 'vitest';
import { renderLegal } from '@/lib/legal/render';
import { site } from '@/site.config';

describe('renderLegal', () => {
  it('substitutes {{businessName}} and {{email}} from config', () => {
    const out = renderLegal('Contact {{businessName}} at {{email}}.');
    expect(out).toBe(`Contact ${site.name} at ${site.business.email}.`);
  });

  it('substitutes {{legalName}}, {{phone}}, {{address}}, {{siteUrl}}, {{date}}', () => {
    const out = renderLegal('{{legalName}} | {{phone}} | {{address}} | {{siteUrl}} | {{date}}');
    const { street, city, region, postalCode } = site.business.address;
    const parts = out.split(' | ');
    expect(parts[0]).toBe(site.business.legalName);
    expect(parts[1]).toBe(site.business.phone);
    expect(parts[2]).toBe(`${street}, ${city}, ${region} ${postalCode}`);
    expect(parts[3]).toMatch(/^https?:\/\//);
    expect(parts[4]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('leaves text with no placeholders untouched', () => {
    expect(renderLegal('Plain text, no braces.')).toBe('Plain text, no braces.');
  });

  it('throws naming an unknown placeholder', () => {
    expect(() => renderLegal('{{bogus}}')).toThrow(/bogus/);
  });

  it('strips a leading HTML comment (and following blank lines) before returning', () => {
    const template =
      '<!-- Starting point, not legal advice. Have a professional review before relying on it. -->\n\n' +
      'Contact {{businessName}} at {{email}}.';
    const out = renderLegal(template);
    expect(out).not.toContain('<!--');
    expect(out).not.toContain('Starting point');
    expect(out).toBe(`Contact ${site.name} at ${site.business.email}.`);
  });

  it('leaves a non-leading HTML comment untouched', () => {
    const out = renderLegal('Body text.\n\n<!-- not a leading comment -->\nMore text.');
    expect(out).toContain('<!-- not a leading comment -->');
  });
});
