import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as readline from 'node:readline';
import type { SiteConfig } from '@/lib/config/types';
import { validateSiteConfig } from '@/lib/config/validate';
import { presets } from '@/presets';

/**
 * npm run setup — interactive wizard that regenerates site.config.ts,
 * app/theme.css, lib/theme.ts, the font region of app/layout.tsx, and
 * .env.local for a fresh brand.
 *
 * Pure logic (color derivation, config building, file serialization) is
 * split from I/O so it's unit-testable without a TTY; only main() talks to
 * the filesystem and stdin/stdout.
 */

export const CONFIG_SENTINEL =
  '// sitekit:config v1 — generated structure; safe to hand-edit. npm run setup will warn before overwriting.';

// ---------------------------------------------------------------------------
// Color math — minimal hex <-> HSL helpers (no deps).
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

interface Hsl { h: number; s: number; l: number }

function hexToHsl(hex: string): Hsl {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** WCAG relative luminance of a hex color. */
function relativeLuminance(hex: string): number {
  const [r8, g8, b8] = hexToRgb(hex);
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r8) + 0.7152 * chan(g8) + 0.0722 * chan(b8);
}

/** WCAG contrast ratio between two hex colors, in [1, 21]. */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Theme derivation
// ---------------------------------------------------------------------------

export interface ThemeColors {
  surface: string;
  surfaceAlt: string;
  surfaceInverse: string;
  surfaceInverseAlt: string;
  fg: string;
  fgInverse: string;
  fgMuted: string;
  accent: string;
  accentAlt: string;
  accentContrast: string;
  borderToken: string;
}

/**
 * Pick a text color that clears WCAG 4.5:1 against `accentHex`, guaranteed
 * for any accent. Preference order:
 *   1. White — matches most brand accents.
 *   2. The derived dark foreground — keeps branded text when it's compliant.
 *   3. Whichever of pure black/white has the higher contrast against the
 *      accent. This is a mathematical guarantee, not a hopeful fallback: for
 *      any color, at least one of {black, white} clears 4.5:1, except in a
 *      vanishingly narrow mid-gray band (worst case ~4.58:1 at relative
 *      luminance ≈0.1791). Steps 1 and 2 alone are NOT sufficient — ordinary
 *      mid-tone accents (e.g. #808080-ish) can fail both, which is exactly
 *      when step 3's guarantee matters.
 */
function pickAccentContrast(accentHex: string, fg: string): string {
  if (contrastRatio('#FFFFFF', accentHex) >= 4.5) return '#FFFFFF';
  if (contrastRatio(fg, accentHex) >= 4.5) return fg;
  const whiteRatio = contrastRatio('#FFFFFF', accentHex);
  const blackRatio = contrastRatio('#000000', accentHex);
  return whiteRatio >= blackRatio ? '#FFFFFF' : '#000000';
}

/**
 * Derive the full 11-token palette from two user-picked hexes. Surfaces and
 * foreground tokens ride the primary color's hue/saturation at fixed
 * lightness steps; accent-alt rotates the accent hue; accent-contrast is
 * chosen by pickAccentContrast() above, which guarantees 4.5:1 against the
 * accent for any input.
 */
export function deriveColors(primaryHex: string, accentHex: string): ThemeColors {
  const primary = hexToHsl(primaryHex);
  const accent = hexToHsl(accentHex);

  const surface = hslToHex(primary.h, primary.s, 97);
  const surfaceAlt = hslToHex(primary.h, primary.s, 93);
  const surfaceInverse = hslToHex(primary.h, primary.s, 10);
  const surfaceInverseAlt = hslToHex(primary.h, primary.s, 16);
  const fg = surfaceInverse;
  const fgInverse = surface;
  const fgMuted = hslToHex(primary.h, primary.s * 0.35, 35);
  const borderToken = hslToHex(primary.h, primary.s, 88);

  const accentAlt = hslToHex(accent.h + 35, accent.s, accent.l);
  const accentContrast = pickAccentContrast(accentHex, fg);

  return {
    surface,
    surfaceAlt,
    surfaceInverse,
    surfaceInverseAlt,
    fg,
    fgInverse,
    fgMuted,
    accent: accentHex,
    accentAlt,
    accentContrast,
    borderToken,
  };
}

// ---------------------------------------------------------------------------
// Config building
// ---------------------------------------------------------------------------

export type AnalyticsProvider = 'plausible' | 'umami' | 'ga4' | 'none';

export interface SetupAnswers {
  name: string;
  tagline: string;
  presetKey: keyof typeof presets;
  primaryColor: string;
  accentColor: string;
  displayFont: string;
  bodyFont: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  analyticsProvider: AnalyticsProvider;
  analyticsSiteId?: string;
  analyticsScriptUrl?: string;
  cms: boolean;
}

/** Build the site.config.ts source object (not yet serialized) from wizard answers. */
export function buildConfig(answers: SetupAnswers): SiteConfig {
  const preset = presets[answers.presetKey];

  return {
    name: answers.name,
    tagline: answers.tagline,
    description: `${answers.name} — ${answers.tagline}`,
    // Canonical origin; NEXT_PUBLIC_SITE_URL overrides at runtime (set to
    // localhost in the generated .env.local for local development).
    url: 'https://example.com',
    logo: null,
    business: {
      legalName: answers.name,
      phone: answers.phone,
      email: answers.email,
      address: {
        street: answers.street,
        city: answers.city,
        region: answers.region,
        postalCode: answers.postalCode,
        country: 'US',
      },
      hours: {
        mon: '9:00-17:00',
        tue: '9:00-17:00',
        wed: '9:00-17:00',
        thu: '9:00-17:00',
        fri: '9:00-17:00',
        sat: '10:00-14:00',
        sun: 'closed',
      },
      serviceAreas: answers.city ? [answers.city] : [],
      services: preset.sampleBusiness.services,
      schemaType: preset.sampleBusiness.schemaType,
    },
    nav: preset.nav,
    footerLinks: [
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
    social: {},
    cta: preset.cta,
    sections: preset.sections,
    copy: preset.copy,
    features: {
      blog: true,
      cms: answers.cms,
      gatedDownload: false,
      analytics: answers.analyticsProvider !== 'none',
    },
    analytics: {
      provider: answers.analyticsProvider,
      siteId: answers.analyticsProvider !== 'none' ? answers.analyticsSiteId : undefined,
      scriptUrl: answers.analyticsProvider === 'umami' ? answers.analyticsScriptUrl : undefined,
    },
  };
}

/** Serialize a SiteConfig object into the full site.config.ts source. */
export function serializeConfig(config: SiteConfig): string {
  const body = JSON.stringify(config, null, 2);
  return `${CONFIG_SENTINEL}
import type { SiteConfig } from '@/lib/config/types';
import { validateSiteConfig } from '@/lib/config/validate';

export const site: SiteConfig = ${body};

validateSiteConfig(site);
export default site;
`;
}

// ---------------------------------------------------------------------------
// Theme file serialization
// ---------------------------------------------------------------------------

const CSS_LABELS: [keyof ThemeColors, string, string][] = [
  ['surface', '--color-surface:', 'page background'],
  ['surfaceAlt', '--color-surface-alt:', 'tinted band on light'],
  ['surfaceInverse', '--color-surface-inverse:', 'dark band background'],
  ['surfaceInverseAlt', '--color-surface-inverse-alt:', 'raised panel on dark'],
];
const CSS_FG_LABELS: [keyof ThemeColors, string, string][] = [
  ['fg', '--color-fg:', 'body text on light'],
  ['fgInverse', '--color-fg-inverse:', 'text on dark bands'],
  ['fgMuted', '--color-fg-muted:', 'secondary text on light'],
];
const CSS_ACCENT_LABELS: [keyof ThemeColors, string, string][] = [
  ['accent', '--color-accent:', 'links, primary CTA'],
  ['accentAlt', '--color-accent-alt:', 'secondary accent, gradients'],
  ['accentContrast', '--color-accent-contrast:', 'text on accent backgrounds'],
];

function cssLine(colors: ThemeColors, [key, label, comment]: [keyof ThemeColors, string, string]): string {
  return `  ${label.padEnd(30)}${colors[key]};  /* ${comment} */`;
}

/** Serialize the derived palette into app/theme.css source. */
export function buildThemeCss(colors: ThemeColors): string {
  return `/* ============================================================
   Sitekit design tokens — THE file to edit for a rebrand.
   Colors also live in lib/theme.ts (used where CSS can't reach:
   OG images, emails). Keep both in sync; a unit test enforces it.
   ============================================================ */
@theme {
  /* Surfaces */
${CSS_LABELS.map(l => cssLine(colors, l)).join('\n')}

  /* Foreground */
${CSS_FG_LABELS.map(l => cssLine(colors, l)).join('\n')}

  /* Accents */
${CSS_ACCENT_LABELS.map(l => cssLine(colors, l)).join('\n')}

  /* Hairlines */
  --color-border-token:         ${colors.borderToken};

  /* Fonts — the Google font families are configured in app/layout.tsx */
  --font-display: var(--font-g-display), Georgia, serif;
  --font-body:    var(--font-g-body), system-ui, -apple-system, sans-serif;
  --font-mono:    var(--font-g-mono), ui-monospace, monospace;
}
`;
}

/** Serialize the derived palette into lib/theme.ts source. */
export function buildThemeTs(colors: ThemeColors): string {
  return `/**
 * Theme colors as TS values, for contexts CSS cannot reach: the generated
 * OG image (Satori) and transactional emails. MUST match app/theme.css —
 * tests/unit/theme-sync.test.ts enforces the pairing.
 */
export const themeColors = {
  surface: '${colors.surface}',
  surfaceAlt: '${colors.surfaceAlt}',
  surfaceInverse: '${colors.surfaceInverse}',
  surfaceInverseAlt: '${colors.surfaceInverseAlt}',
  fg: '${colors.fg}',
  fgInverse: '${colors.fgInverse}',
  fgMuted: '${colors.fgMuted}',
  accent: '${colors.accent}',
  accentAlt: '${colors.accentAlt}',
  accentContrast: '${colors.accentContrast}',
  borderToken: '${colors.borderToken}',
} as const;
`;
}

// ---------------------------------------------------------------------------
// Font region rewriting (app/layout.tsx)
// ---------------------------------------------------------------------------

interface FontSpec {
  importName: string;
  extra?: Record<string, string | string[]>;
}

/** Curated display fonts the wizard offers, in prompt order. */
export const DISPLAY_FONTS: Record<string, FontSpec> = {
  'Instrument Serif': { importName: 'Instrument_Serif', extra: { weight: '400', style: ['normal', 'italic'] } },
  'Playfair Display': { importName: 'Playfair_Display' },
  Fraunces: { importName: 'Fraunces' },
  Lora: { importName: 'Lora' },
};

/** Curated body fonts the wizard offers, in prompt order. */
export const BODY_FONTS: Record<string, FontSpec> = {
  Geist: { importName: 'Geist' },
  Inter: { importName: 'Inter' },
  'Source Sans 3': { importName: 'Source_Sans_3' },
  'IBM Plex Sans': { importName: 'IBM_Plex_Sans', extra: { weight: ['400', '500', '600', '700'] } },
};

function jsLiteral(v: string | string[]): string {
  return Array.isArray(v) ? `[${v.map(jsLiteral).join(', ')}]` : `'${v}'`;
}

function serializeFontCall(spec: FontSpec, variable: string): string {
  const props: string[] = [];
  if (spec.extra) {
    for (const [k, v] of Object.entries(spec.extra)) props.push(`${k}: ${jsLiteral(v)}`);
  }
  props.push(`subsets: ${jsLiteral(['latin'])}`);
  props.push(`variable: ${jsLiteral(variable)}`);

  if (!spec.extra) {
    return `${spec.importName}({ ${props.join(', ')} })`;
  }
  return `${spec.importName}({\n  ${props.join(',\n  ')},\n})`;
}

const FONTS_START = '// sitekit:fonts-start';
const FONTS_END = '// sitekit:fonts-end';
const FONT_IMPORT_RE = /import \{[^}]*\} from 'next\/font\/google';/;

/**
 * Rewrite the `next/font/google` import line and the marked const region in
 * app/layout.tsx source for a newly chosen display/body font pair. Mono
 * stays Geist_Mono — it isn't offered as a choice.
 */
export function rewriteLayoutFonts(source: string, displayFamily: string, bodyFamily: string): string {
  const displaySpec = DISPLAY_FONTS[displayFamily];
  const bodySpec = BODY_FONTS[bodyFamily];
  if (!displaySpec) throw new Error(`Unknown display font: "${displayFamily}"`);
  if (!bodySpec) throw new Error(`Unknown body font: "${bodyFamily}"`);

  if (!source.includes(FONTS_START) || !source.includes(FONTS_END)) {
    throw new Error(
      `app/layout.tsx is missing the ${FONTS_START} / ${FONTS_END} markers — cannot rewrite the font region.`,
    );
  }

  const importNames = [bodySpec.importName, 'Geist_Mono', displaySpec.importName];
  const constBlock = [
    `const body = ${serializeFontCall(bodySpec, '--font-g-body')};`,
    `const mono = ${serializeFontCall({ importName: 'Geist_Mono' }, '--font-g-mono')};`,
    `const display = ${serializeFontCall(displaySpec, '--font-g-display')};`,
  ].join('\n');

  let out = source.replace(FONT_IMPORT_RE, `import { ${importNames.join(', ')} } from 'next/font/google';`);

  const startIdx = out.indexOf(FONTS_START);
  const endIdx = out.indexOf(FONTS_END);
  const before = out.slice(0, startIdx + FONTS_START.length);
  const after = out.slice(endIdx);
  out = `${before}\n${constBlock}\n${after}`;
  return out;
}

// ---------------------------------------------------------------------------
// Interactive main()
// ---------------------------------------------------------------------------

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

type Ask = (question: string) => Promise<string>;

async function askNumber(ask: Ask, prompt: string, min: number, max: number, def: number): Promise<number> {
  for (;;) {
    const raw = (await ask(prompt)).trim();
    if (raw === '') return def;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= min && n <= max) return n;
    console.log(`  Please enter a number between ${min} and ${max}.`);
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Deliberately NOT using rl.question() in a loop: on at least this
  // platform/Node combination, repeated question() calls against a
  // non-TTY stdin (piped/redirected input, as used by CI and by the
  // manual-answers workflow) hang after the first call. Pulling lines
  // off the Interface's async iterator instead is the pattern Node's own
  // readline docs recommend for line-by-line prompts and works
  // identically for an interactive TTY and for piped input.
  const lines = rl[Symbol.asyncIterator]();
  const ask: Ask = async prompt => {
    process.stdout.write(prompt);
    const { value, done } = await lines.next();
    return done ? '' : value;
  };

  try {
    const configPath = path.resolve(process.cwd(), 'site.config.ts');
    const hashPath = path.resolve(process.cwd(), '.sitekit-config-hash');

    if (existsSync(configPath)) {
      const current = readFileSync(configPath, 'utf8');
      const hasSentinel = current.startsWith(CONFIG_SENTINEL);
      const storedHash = existsSync(hashPath) ? readFileSync(hashPath, 'utf8').trim() : null;
      const currentHash = sha256(current);
      const handEdited = storedHash !== null && storedHash !== currentHash;

      if (!hasSentinel || handEdited) {
        console.log('\nsite.config.ts has been hand-edited since it was last generated' + (hasSentinel ? '' : ' (or predates the setup wizard)') + '.');
        console.log('Running setup will REPLACE site.config.ts, app/theme.css, lib/theme.ts, and the');
        console.log('font region of app/layout.tsx. Your edits to those files will be lost.\n');
        const answer = await ask("Type 'overwrite' to continue, or anything else to cancel: ");
        if (answer.trim() !== 'overwrite') {
          console.log('Cancelled. No files were changed.');
          return;
        }
      }
    }

    console.log('\nSitekit setup');
    console.log('=============\n');

    const name = await ask('Business name: ');
    const tagline = await ask('Tagline (one line): ');

    console.log('\nChoose a preset:');
    const presetKeys = Object.keys(presets) as (keyof typeof presets)[];
    presetKeys.forEach((k, i) => console.log(`  ${i + 1}. ${presets[k].label} — ${presets[k].description}`));
    const presetIdx = await askNumber(ask, `Preset [1-${presetKeys.length}] (default 1): `, 1, presetKeys.length, 1);
    const presetKey = presetKeys[presetIdx - 1];

    const primaryColor = (await ask('Primary color hex [#0E1020]: ')).trim() || '#0E1020';
    const accentColor = (await ask('Accent color hex [#F75D6E]: ')).trim() || '#F75D6E';

    console.log('\nDisplay font:');
    const displayKeys = Object.keys(DISPLAY_FONTS);
    displayKeys.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    const displayIdx = await askNumber(ask, `Display font [1-${displayKeys.length}] (default 1): `, 1, displayKeys.length, 1);
    const displayFont = displayKeys[displayIdx - 1];

    console.log('\nBody font:');
    const bodyKeys = Object.keys(BODY_FONTS);
    bodyKeys.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    const bodyIdx = await askNumber(ask, `Body font [1-${bodyKeys.length}] (default 1): `, 1, bodyKeys.length, 1);
    const bodyFont = bodyKeys[bodyIdx - 1];

    const phone = await ask('\nPhone (e.g. +1-555-010-0100): ');
    const email = await ask('Email: ');
    const street = await ask('Street address: ');
    const city = await ask('City: ');
    const region = await ask('State/region: ');
    const postalCode = await ask('ZIP/postal code: ');

    console.log('\nAnalytics provider:');
    const providers: AnalyticsProvider[] = ['none', 'plausible', 'umami', 'ga4'];
    providers.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    const providerIdx = await askNumber(ask, `Analytics [1-${providers.length}] (default 1 = none): `, 1, providers.length, 1);
    const analyticsProvider = providers[providerIdx - 1];

    let analyticsSiteId: string | undefined;
    let analyticsScriptUrl: string | undefined;
    if (analyticsProvider !== 'none') {
      analyticsSiteId = (await ask(`${analyticsProvider} site ID: `)).trim();
      if (analyticsProvider === 'umami') {
        analyticsScriptUrl = (await ask('Umami script URL: ')).trim();
      }
    }

    const cmsRaw = (await ask('\nEnable CMS (Supabase-backed content)? [y/N]: ')).trim().toLowerCase();
    const cms = cmsRaw === 'y' || cmsRaw === 'yes';

    const answers: SetupAnswers = {
      name, tagline, presetKey, primaryColor, accentColor, displayFont, bodyFont,
      phone, email, street, city, region, postalCode,
      analyticsProvider, analyticsSiteId, analyticsScriptUrl, cms,
    };

    const config = buildConfig(answers);
    validateSiteConfig(config); // fail fast, before touching disk
    const configSource = serializeConfig(config);

    const colors = deriveColors(primaryColor, accentColor);
    const themeCss = buildThemeCss(colors);
    const themeTs = buildThemeTs(colors);

    const layoutPath = path.resolve(process.cwd(), 'app/layout.tsx');
    const newLayoutSource = rewriteLayoutFonts(readFileSync(layoutPath, 'utf8'), displayFont, bodyFont);

    writeFileSync(configPath, configSource);
    writeFileSync(path.resolve(process.cwd(), 'app/theme.css'), themeCss);
    writeFileSync(path.resolve(process.cwd(), 'lib/theme.ts'), themeTs);
    writeFileSync(layoutPath, newLayoutSource);
    writeFileSync(hashPath, sha256(configSource));

    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    const envLocalContent = buildEnvLocal(cms);
    const envLocalExists = existsSync(envLocalPath);
    if (envLocalExists) {
      console.log('\n.env.local already exists -- leaving it untouched. Add these to your existing .env.local:\n');
      console.log(envLocalContent);
    } else {
      writeFileSync(envLocalPath, envLocalContent);
    }

    console.log('\nDone. Generated:');
    console.log('  site.config.ts');
    console.log('  app/theme.css');
    console.log('  lib/theme.ts');
    console.log('  app/layout.tsx  (font region)');
    console.log(envLocalExists ? '  .env.local  (skipped -- already exists, see above)' : '  .env.local');
    console.log('\nNext steps:');
    console.log('  npm run dev     -- start the dev server');
    console.log('  edit content/   -- blog posts and other file-backed content');
    console.log('  see AGENTS.md   -- project conventions for this codebase');
  } finally {
    rl.close();
  }
}

/**
 * Build the full contents of a generated `.env.local` (trailing newline
 * included). Pure so the guard logic in main() -- and the content itself --
 * can be unit-tested without touching the filesystem.
 */
export function buildEnvLocal(cms: boolean): string {
  const envLines = [
    'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
    '',
    '# Optional -- site verification',
    '# GOOGLE_SITE_VERIFICATION=',
    '# BING_SITE_VERIFICATION=',
    '',
    '# Optional -- lead rate limiting salt',
    '# LEAD_RATE_LIMIT_SALT=',
    '',
    '# Optional -- admin emails (comma-separated) for the admin UI',
    '# ADMIN_EMAILS=you@example.com',
    '',
    '# Optional -- unsubscribe link signing secret. Generate: openssl rand -hex 32',
    '# UNSUBSCRIBE_SECRET=',
  ];
  if (cms) {
    envLines.push(
      '',
      '# CMS (Supabase) -- fill these in from your Supabase project settings,',
      '# then remove the leading # on each line.',
      '# NEXT_PUBLIC_SUPABASE_URL=',
      '# NEXT_PUBLIC_SUPABASE_ANON_KEY=',
      '# SUPABASE_SERVICE_ROLE_KEY=',
    );
  }
  return envLines.join('\n') + '\n';
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
