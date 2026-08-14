import type { Preset } from './types';
import { localServicePreset } from './local-service';
import { professionalPreset } from './professional';
import { hospitalityPreset } from './hospitality';
import { portfolioPreset } from './portfolio';

/**
 * The four vertical presets the setup wizard offers. Each one ships complete
 * copy for every section it lists, so a fresh config renders as a finished
 * site on the first `npm run dev`.
 */
export const presets: Record<Preset['key'], Preset> = {
  'local-service': localServicePreset,
  professional: professionalPreset,
  hospitality: hospitalityPreset,
  portfolio: portfolioPreset,
};

export type { Preset };
export { localServicePreset, professionalPreset, hospitalityPreset, portfolioPreset };
