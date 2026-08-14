import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateSiteConfig } from '@/lib/config/validate';
import { presets } from '@/presets';
import {
  deriveColors,
  buildConfig,
  serializeConfig,
  buildThemeCss,
  buildThemeTs,
  rewriteLayoutFonts,
  contrastRatio,
  buildEnvLocal,
  type SetupAnswers,
} from '@/scripts/setup';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe('deriveColors', () => {
  const colors = deriveColors('#1D4ED8', '#F59E0B');

  it('returns 11 valid hex colors', () => {
    const values = Object.values(colors);
    expect(values).toHaveLength(11);
    for (const v of values) {
      expect(v).toMatch(HEX_RE);
    }
  });

  it('preserves the accent input verbatim', () => {
    expect(colors.accent).toBe('#F59E0B');
  });

  it('picks an accent-contrast that meets WCAG 4.5:1 against accent', () => {
    expect(contrastRatio(colors.accentContrast, colors.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('derives fg/fg-inverse as the surface-inverse/surface pair', () => {
    expect(colors.fg).toBe(colors.surfaceInverse);
    expect(colors.fgInverse).toBe(colors.surface);
  });

  it('derives distinct surfaces at different lightness steps', () => {
    expect(colors.surface).not.toBe(colors.surfaceAlt);
    expect(colors.surface).not.toBe(colors.surfaceInverse);
    expect(colors.surfaceInverse).not.toBe(colors.surfaceInverseAlt);
  });

  it('always meets 4.5:1 accent-contrast, even for a dark accent', () => {
    const dark = deriveColors('#1D4ED8', '#111827');
    expect(contrastRatio(dark.accentContrast, dark.accent)).toBeGreaterThanOrEqual(4.5);
  });

  // Regression: a bare `white-or-fg` choice fails for ordinary mid-tone
  // accents, where neither white nor the derived dark foreground reliably
  // clears 4.5:1 (e.g. #166534/#808080 previously landed at 3.93:1).
  it('always meets 4.5:1 accent-contrast for a mid-tone accent that neither white nor fg clears', () => {
    const midTone = deriveColors('#166534', '#808080');
    expect(contrastRatio(midTone.accentContrast, midTone.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets 4.5:1 accent-contrast across a sweep of mid-tone accents', () => {
    const midToneAccents = [
      '#6B6B6B', '#707070', '#757575', '#7A7A7A', '#808080',
      '#858585', '#8A8A8A', '#909090', '#4D5A5F', '#5F6B4D',
    ];
    for (const accentHex of midToneAccents) {
      const c = deriveColors('#1D4ED8', accentHex);
      expect(
        contrastRatio(c.accentContrast, c.accent),
        `accent-contrast for accent ${accentHex} only reached ${contrastRatio(c.accentContrast, c.accent).toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

const sampleAnswers: SetupAnswers = {
  name: 'GreenLeaf Lawn Care',
  tagline: 'Lawn care that shows up on time.',
  presetKey: 'local-service',
  primaryColor: '#166534',
  accentColor: '#F75D6E',
  displayFont: 'Instrument Serif',
  bodyFont: 'Geist',
  phone: '+1-555-010-0199',
  email: 'hello@greenleaflawn.example',
  street: '100 Main St',
  city: 'Denver',
  region: 'CO',
  postalCode: '80202',
  analyticsProvider: 'none',
  cms: false,
};

describe('buildConfig', () => {
  it('produces a config object that passes validateSiteConfig', () => {
    const config = buildConfig(sampleAnswers);
    expect(() => validateSiteConfig(config)).not.toThrow();
  });

  it('carries the answered name and the chosen preset sections', () => {
    const config = buildConfig(sampleAnswers);
    expect(config.name).toBe('GreenLeaf Lawn Care');
    expect(config.tagline).toBe('Lawn care that shows up on time.');
    expect(config.sections).toEqual(presets['local-service'].sections);
    expect(config.copy).toEqual(presets['local-service'].copy);
    expect(config.business.services).toEqual(presets['local-service'].sampleBusiness.services);
  });

  it('sets features.cms from the cms answer', () => {
    expect(buildConfig(sampleAnswers).features.cms).toBe(false);
    expect(buildConfig({ ...sampleAnswers, cms: true }).features.cms).toBe(true);
  });

  it('wires up analytics when a provider other than none is chosen, and still validates', () => {
    const config = buildConfig({ ...sampleAnswers, analyticsProvider: 'ga4', analyticsSiteId: 'G-ABC1234' });
    expect(config.features.analytics).toBe(true);
    expect(config.analytics).toEqual({ provider: 'ga4', siteId: 'G-ABC1234', scriptUrl: undefined });
    expect(() => validateSiteConfig(config)).not.toThrow();
  });
});

describe('serializeConfig', () => {
  it('contains the sentinel and the default export, and round-trips the config data', () => {
    const config = buildConfig(sampleAnswers);
    const source = serializeConfig(config);
    expect(source).toContain('sitekit:config v1');
    expect(source).toContain('export default site;');
    expect(source).toContain('validateSiteConfig(site);');
    expect(source).toContain("import type { SiteConfig } from '@/lib/config/types';");
    expect(source).toContain('GreenLeaf Lawn Care');
  });
});

describe('buildThemeCss / buildThemeTs', () => {
  it('embed all 11 derived colors and stay paired with each other', () => {
    const colors = deriveColors('#166534', '#F75D6E');
    const css = buildThemeCss(colors);
    const ts = buildThemeTs(colors);
    for (const hex of Object.values(colors)) {
      expect(css).toContain(hex);
      expect(ts).toContain(hex);
    }
    expect(ts).toContain('export const themeColors');
    expect(css).toContain('@theme {');
  });
});

describe('rewriteLayoutFonts', () => {
  const layoutSource = readFileSync('app/layout.tsx', 'utf8');

  it('replaces the font import and the marked const region for a different font pair', () => {
    const out = rewriteLayoutFonts(layoutSource, 'Fraunces', 'Inter');
    expect(out).toContain("import { Inter, Geist_Mono, Fraunces } from 'next/font/google';");
    expect(out).toContain('const display = Fraunces({');
    expect(out).toContain('const body = Inter({');
    expect(out).not.toContain('Instrument_Serif');
    // Markers survive the rewrite so the wizard can run again.
    expect(out).toContain('// sitekit:fonts-start');
    expect(out).toContain('// sitekit:fonts-end');
  });

  it('handles a font requiring explicit weights (IBM Plex Sans)', () => {
    const out = rewriteLayoutFonts(layoutSource, 'Lora', 'IBM Plex Sans');
    expect(out).toContain("import { IBM_Plex_Sans, Geist_Mono, Lora } from 'next/font/google';");
    expect(out).toMatch(/const body = IBM_Plex_Sans\(\{[\s\S]*weight:/);
  });

  it('throws a readable error when the markers are missing', () => {
    const stripped = layoutSource.replace('// sitekit:fonts-start\n', '').replace('// sitekit:fonts-end\n', '');
    expect(() => rewriteLayoutFonts(stripped, 'Lora', 'Inter')).toThrow(/sitekit:fonts/);
  });
});

describe('buildEnvLocal', () => {
  it('includes the site URL line and a trailing newline', () => {
    const out = buildEnvLocal(false);
    expect(out).toContain('NEXT_PUBLIC_SITE_URL=http://localhost:3000');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('omits Supabase CMS lines when cms is false', () => {
    const out = buildEnvLocal(false);
    expect(out).not.toContain('SUPABASE');
  });

  it('includes commented Supabase CMS lines when cms is true', () => {
    const out = buildEnvLocal(true);
    expect(out).toContain('# NEXT_PUBLIC_SUPABASE_URL=');
    expect(out).toContain('# NEXT_PUBLIC_SUPABASE_ANON_KEY=');
    expect(out).toContain('# SUPABASE_SERVICE_ROLE_KEY=');
  });

  it('is deterministic for the same input', () => {
    expect(buildEnvLocal(true)).toBe(buildEnvLocal(true));
    expect(buildEnvLocal(false)).toBe(buildEnvLocal(false));
  });
});
