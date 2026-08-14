// @vitest-environment node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { COMPONENT_NAME } from '@/app/(site)/preview/page';
import { ALL_SECTION_KEYS } from '@/lib/config/validate';

/**
 * The preview page renders BlogTeaser, an async server component, so the
 * full page can't render under jsdom (see sections-registry.test.tsx for the
 * synchronous-section coverage). This just guards the label map: every
 * section key must be present and point at a file that actually exists
 * under components/sections/.
 */
describe('preview page component name map', () => {
  it('covers every ALL_SECTION_KEYS entry, in registry order', () => {
    expect(Object.keys(COMPONENT_NAME).sort()).toEqual([...ALL_SECTION_KEYS].sort());
  });

  it.each(ALL_SECTION_KEYS)('%s points at a real component file', key => {
    const file = path.join(process.cwd(), 'components/sections', `${COMPONENT_NAME[key]}.tsx`);
    expect(existsSync(file)).toBe(true);
  });
});
