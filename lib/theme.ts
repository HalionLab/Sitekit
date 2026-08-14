/**
 * Theme colors as TS values, for contexts CSS cannot reach: the generated
 * OG image (Satori) and transactional emails. MUST match app/theme.css —
 * tests/unit/theme-sync.test.ts enforces the pairing.
 */
export const themeColors = {
  surface: '#FAF7F2',
  surfaceAlt: '#FFF1E0',
  surfaceInverse: '#0E1020',
  surfaceInverseAlt: '#1F2238',
  fg: '#0E1020',
  fgInverse: '#FAF7F2',
  fgMuted: '#4A4D63',
  accent: '#F75D6E',
  accentAlt: '#F9A03F',
  accentContrast: '#FFFFFF',
  borderToken: '#E3DED4',
} as const;
