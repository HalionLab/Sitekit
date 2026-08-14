import type { CustomSectionModule } from './define';
import { halionHero } from './HalionHero';
import { halionProjects } from './HalionProjects';
import { halionBuildLog } from './HalionBuildLog';
import { halionCommunity } from './HalionCommunity';

export type { CustomSectionModule } from './define';
export { defineCustomSection } from './define';

/** One entry per `custom:<name>` key usable in `site.sections`. */
export const customSections: Record<string, CustomSectionModule> = {
  halionHero,
  halionProjects,
  halionBuildLog,
  halionCommunity,
};
