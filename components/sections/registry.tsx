import { Fragment, type ReactNode } from 'react';
import type { SectionCopy, SectionKey } from '@/lib/config/types';
import { About } from './About';
import { BlogTeaser } from './BlogTeaser';
import { ContactBand } from './ContactBand';
import { CtaBand } from './CtaBand';
import { Faq } from './Faq';
import { Gallery } from './Gallery';
import { Hero } from './Hero';
import { HoursMap } from './HoursMap';
import { LogoStrip } from './LogoStrip';
import { Pricing } from './Pricing';
import { ProcessSteps } from './ProcessSteps';
import { ServicesGrid } from './ServicesGrid';
import { StatsBand } from './StatsBand';
import { TeamGrid } from './TeamGrid';
import { Testimonials } from './Testimonials';

/**
 * One entry per `SectionKey`. Sections in `SECTIONS_REQUIRING_COPY` (see
 * `lib/config/validate.ts`) assume `config.copy.<key>` is present -- the
 * validator throws before render if it's missing, so `!` is safe there.
 * The remaining sections (`servicesGrid`, `contactBand`, `hoursMap`,
 * `blogTeaser`) have full inline defaults, matching the validator's
 * "optional copy" list.
 */
export const registry: Record<SectionKey, (copy: SectionCopy) => ReactNode> = {
  hero: c => <Hero copy={c.hero!} />,
  servicesGrid: c => <ServicesGrid copy={c.servicesGrid ?? { heading: 'What we do' }} />,
  about: c => <About copy={c.about!} />,
  testimonials: c => <Testimonials copy={c.testimonials!} />,
  gallery: c => <Gallery copy={c.gallery!} />,
  faq: c => <Faq copy={c.faq!} />,
  pricing: c => <Pricing copy={c.pricing!} />,
  contactBand: c =>
    <ContactBand
      copy={c.contactBand ?? { heading: 'Get in touch', sub: 'Tell us what you need and we will get back to you.' }}
    />,
  teamGrid: c => <TeamGrid copy={c.teamGrid!} />,
  processSteps: c => <ProcessSteps copy={c.processSteps!} />,
  statsBand: c => <StatsBand copy={c.statsBand!} />,
  logoStrip: c => <LogoStrip copy={c.logoStrip!} />,
  ctaBand: c => <CtaBand copy={c.ctaBand!} />,
  hoursMap: c => <HoursMap copy={c.hoursMap ?? { heading: 'Hours & location' }} />,
  blogTeaser: c => <BlogTeaser copy={c.blogTeaser ?? { heading: 'From the blog' }} />,
};

/** Renders `keys` in order, each wrapped in a keyed `<Fragment>`. This is how
 * the homepage is built: `app/(site)/page.tsx` calls it with
 * `site.sections`/`site.copy`. The `registry` map itself is also consumed
 * directly by the kitchen-sink route (`app/(site)/preview/page.tsx`), which
 * renders every key with demo copy, and by the unit tests. */
export function renderSections(keys: SectionKey[], copy: SectionCopy): ReactNode {
  return (
    <>
      {keys.map(key => (
        <Fragment key={key}>{registry[key](copy)}</Fragment>
      ))}
    </>
  );
}
