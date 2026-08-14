import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { themeColors } from '@/lib/theme';

const CSS_NAMES: Record<keyof typeof themeColors, string> = {
  surface: '--color-surface', surfaceAlt: '--color-surface-alt',
  surfaceInverse: '--color-surface-inverse', surfaceInverseAlt: '--color-surface-inverse-alt',
  fg: '--color-fg', fgInverse: '--color-fg-inverse', fgMuted: '--color-fg-muted',
  accent: '--color-accent', accentAlt: '--color-accent-alt',
  accentContrast: '--color-accent-contrast', borderToken: '--color-border-token',
};

describe('theme.css and lib/theme.ts stay in sync', () => {
  const css = readFileSync('app/theme.css', 'utf8');
  for (const [key, cssVar] of Object.entries(CSS_NAMES)) {
    it(`${cssVar} matches themeColors.${key}`, () => {
      const m = css.match(new RegExp(`${cssVar}:\\s*(#[0-9A-Fa-f]{6})`));
      expect(m, `${cssVar} not found in theme.css`).toBeTruthy();
      expect(m![1].toUpperCase()).toBe(themeColors[key as keyof typeof themeColors].toUpperCase());
    });
  }
});
