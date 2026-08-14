import type { SectionKey, SectionCopy, BusinessInfo, NavLink, Cta } from '@/lib/config/types';

/**
 * A vertical preset: the section order, copy, sample services, nav, and CTAs
 * the setup wizard uses to seed a new `site.config.ts`.
 *
 * Presets ship COMPLETE copy for every section they list — including the
 * sections whose copy is optional at validation time. The wizard writes the
 * result straight to disk, and a config full of real sentences is the whole
 * point: the first render should look like a real site, not a wireframe.
 */
export interface Preset {
  key: 'local-service' | 'professional' | 'hospitality' | 'portfolio';
  /** Shown by the wizard in the preset picker. */
  label: string;
  /** One line, shown by the wizard under the label. */
  description: string;
  sections: SectionKey[];
  /** Complete copy for every section listed in `sections`, and nothing else. */
  copy: SectionCopy;
  sampleBusiness: Pick<BusinessInfo, 'services' | 'schemaType'>;
  nav: NavLink[];
  cta: { primary: Cta; secondary?: Cta };
}
