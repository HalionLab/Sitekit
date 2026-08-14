import type { CustomSectionModule } from './define';
import { halionHero } from './HalionHero';
import { halionProjects } from './HalionProjects';
import { halionBuildLog } from './HalionBuildLog';
import { halionCommunity } from './HalionCommunity';

export type { CustomSectionModule } from './define';
export { defineCustomSection } from './define';

/**
 * Registry for site-specific sections outside the built-in library — the
 * escape hatch for layouts the 15 stock sections can't express.
 *
 * To add one:
 *   1. Create `components/sections/custom/<Name>.tsx` exporting a module via
 *      `defineCustomSection<YourCopy>({ Component, validateCopy })` — see
 *      `./define.ts` for the contract and `./copy-utils.ts` for validation
 *      helpers. Style with design tokens only; `tests/unit/token-discipline`
 *      fails the build on color literals.
 *   2. Register it here.
 *   3. Use it: add `'custom:<name>'` to `site.sections` and put its copy at
 *      `site.copy.custom.<name>` in `site.config.ts`.
 *
 * This site registers the Halion Lab sections built from the claude.design
 * mockup. (The upstream template ships this registry empty.)
 */
export const customSections: Record<string, CustomSectionModule> = {
  halionHero,
  halionProjects,
  halionBuildLog,
  halionCommunity,
};
