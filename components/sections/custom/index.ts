import type { CustomSectionModule } from './define';

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
 *   2. Register it here: `export const customSections = { myBand }`.
 *   3. Use it: add `'custom:myBand'` to `site.sections` and put its copy at
 *      `site.copy.custom.myBand` in `site.config.ts`.
 *
 * The template ships this registry empty on purpose — custom sections belong
 * to individual sites (or to `/import-design` conversions), not the template.
 */
export const customSections: Record<string, CustomSectionModule> = {};
