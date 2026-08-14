import type { ReactNode } from 'react';

/**
 * A site-specific section outside the built-in library. `Component` renders
 * with copy that `validateCopy` has already checked; `validateCopy` receives
 * the raw `site.copy.custom[<name>]` value and either returns it typed or
 * throws a descriptive error (prefixed `copy.custom.<name>:`). It is the
 * custom counterpart of `lib/config/validate.ts`, kept in components/ so that
 * file stays React-free.
 */
export interface CustomSectionModule<C = unknown> {
  Component: (props: { copy: C }) => ReactNode;
  validateCopy: (raw: unknown) => C;
}

/** Erases the copy type so heterogeneous modules can share one registry. */
export function defineCustomSection<C>(mod: CustomSectionModule<C>): CustomSectionModule {
  return mod as CustomSectionModule;
}
