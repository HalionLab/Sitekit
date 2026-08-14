import { describe, it, expect } from 'vitest';
import { presets } from '@/presets';
import type { Preset } from '@/presets/types';
import { ALL_SECTION_KEYS, SECTIONS_REQUIRING_COPY } from '@/lib/config/validate';

const PRESET_KEYS: Preset['key'][] = ['local-service', 'professional', 'hospitality', 'portfolio'];

/** Every string reachable from `value`, including object keys' values and array items. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

const PLACEHOLDER_RE = /lorem|todo|tbd/i;

describe('presets', () => {
  it('exports exactly the four vertical presets', () => {
    expect(Object.keys(presets).sort()).toEqual([...PRESET_KEYS].sort());
  });

  it('keys the record by each preset own key', () => {
    for (const key of PRESET_KEYS) {
      expect(presets[key].key).toBe(key);
    }
  });

  describe.each(PRESET_KEYS)('%s', key => {
    const preset = () => presets[key];

    it('has a label and a one-line description', () => {
      expect(preset().label.trim().length).toBeGreaterThan(0);
      expect(preset().description.trim().length).toBeGreaterThan(0);
      expect(preset().description).not.toContain('\n');
    });

    it('lists only valid section keys, with no duplicates', () => {
      const { sections } = preset();
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) {
        expect(ALL_SECTION_KEYS).toContain(section);
      }
      expect(new Set(sections).size).toBe(sections.length);
    });

    it('provides copy for every copy-required section it lists', () => {
      const { sections, copy } = preset();
      for (const section of sections) {
        if (SECTIONS_REQUIRING_COPY.includes(section)) {
          expect(copy[section], `copy.${section} missing`).toBeDefined();
        }
      }
    });

    it('provides copy for every section it lists, required or not', () => {
      const { sections, copy } = preset();
      for (const section of sections) {
        expect(copy[section], `copy.${section} missing`).toBeDefined();
      }
    });

    it('carries no copy for sections it does not list', () => {
      const { sections, copy } = preset();
      for (const section of Object.keys(copy) as (keyof typeof copy)[]) {
        expect(sections, `copy.${section} has no matching section`).toContain(section);
      }
    });

    it('omits blogTeaser entirely', () => {
      expect(preset().sections).not.toContain('blogTeaser');
      expect(preset().copy.blogTeaser).toBeUndefined();
    });

    it('contains no placeholder markers', () => {
      for (const text of collectStrings(preset())) {
        expect(text, `placeholder marker in: ${text}`).not.toMatch(PLACEHOLDER_RE);
      }
    });

    it('ships a sample business with services and a schema type', () => {
      const { sampleBusiness } = preset();
      expect(sampleBusiness.services.length).toBeGreaterThan(0);
      for (const service of sampleBusiness.services) {
        expect(service.name.trim().length).toBeGreaterThan(0);
        expect(service.description.trim().length).toBeGreaterThan(0);
      }
      expect(['LocalBusiness', 'ProfessionalService', 'Organization']).toContain(
        sampleBusiness.schemaType,
      );
    });

    it('ships nav links and a primary CTA', () => {
      const { nav, cta } = preset();
      expect(nav.length).toBeGreaterThan(0);
      for (const link of nav) {
        expect(link.label.trim().length).toBeGreaterThan(0);
        expect(link.href.trim().length).toBeGreaterThan(0);
      }
      expect(cta.primary.label.trim().length).toBeGreaterThan(0);
      expect(cta.primary.href.trim().length).toBeGreaterThan(0);
    });
  });
});
