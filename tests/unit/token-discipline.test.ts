import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Token-discipline gate: section components must style through design tokens
 * (`bg-surface`, `text-fg-muted`, `var(--color-*)`), never color literals.
 * This is the guardrail that keeps generated/custom sections rebrandable —
 * change the 11 tokens and every section follows.
 *
 * Scope: lines that declare `className` or `style` in components/sections/**.
 * Checked syntaxes: hex, rgb()/rgba(), hsl()/hsla(), oklch()/oklab().
 * (CSS named colors are not checked — too collision-prone with prose; the
 * import skill's generation prompt forbids them instead.)
 */

const SECTIONS_DIR = join(__dirname, '..', '..', 'components', 'sections');

// \b prevents matching the "rgb(" inside "srgb(" (color-mix(in srgb, ...)).
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\boklab\(/;
const STYLE_CONTEXT = /className|style=|style:/;

function collectTsx(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collectTsx(full);
    return /\.(tsx|ts)$/.test(entry) ? [full] : [];
  });
}

describe('token discipline in section components', () => {
  const files = collectTsx(SECTIONS_DIR);

  it('finds section components to check', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  for (const file of files) {
    it(`${file.split(/[\\/]/).slice(-2).join('/')} has no color literals in styling`, () => {
      const lines = readFileSync(file, 'utf8').split('\n');
      const offenders = lines
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => STYLE_CONTEXT.test(line) && COLOR_LITERAL.test(line))
        .map(({ line, n }) => `  line ${n}: ${line.trim()}`);
      expect(offenders, `color literals in styling:\n${offenders.join('\n')}`).toEqual([]);
    });
  }
});
