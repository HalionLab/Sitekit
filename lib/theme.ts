/**
 * Theme colors as TS values, for contexts CSS cannot reach: the generated
 * OG image (Satori) and transactional emails. MUST match app/theme.css —
 * tests/unit/theme-sync.test.ts enforces the pairing.
 */
export const themeColors = {
  surface: '#0B0B0D',
  surfaceAlt: '#0D0D10',
  surfaceInverse: '#1A1A1F',
  surfaceInverseAlt: '#1F1F24',
  fg: '#FFFFFF',
  fgInverse: '#FFFFFF',
  fgMuted: '#A1A1AA',
  accent: '#FFFFFF',
  accentAlt: '#A1A1AA',
  accentContrast: '#0B0B0D',
  borderToken: '#2A2A2E',
} as const;
