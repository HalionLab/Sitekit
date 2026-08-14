import type { Metadata } from 'next';
import { registry } from '@/components/sections/registry';
import { ALL_SECTION_KEYS } from '@/lib/config/validate';
import type { SectionCopy, SectionKey } from '@/lib/config/types';
import { hospitalityPreset, localServicePreset, portfolioPreset, professionalPreset } from '@/presets';

export const metadata: Metadata = {
  title: 'Section preview',
  robots: { index: false, follow: false },
};

/**
 * The section component that backs each key, matching the filenames under
 * `components/sections/`. Kept in sync with `ALL_SECTION_KEYS` by the
 * exhaustiveness test in `tests/unit/preview-page.test.ts`.
 */
export const COMPONENT_NAME: Record<SectionKey, string> = {
  hero: 'Hero',
  servicesGrid: 'ServicesGrid',
  about: 'About',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  faq: 'Faq',
  pricing: 'Pricing',
  contactBand: 'ContactBand',
  teamGrid: 'TeamGrid',
  processSteps: 'ProcessSteps',
  statsBand: 'StatsBand',
  logoStrip: 'LogoStrip',
  ctaBand: 'CtaBand',
  hoursMap: 'HoursMap',
  blogTeaser: 'BlogTeaser',
};

/**
 * Sample copy for every section, borrowed from the four vertical presets so
 * each one renders with realistic content instead of lorem ipsum. Sections
 * that only appear in one preset (statsBand, logoStrip) pull from that
 * preset; sections that appear in several pull from whichever preset shows
 * off the section best (pricing tiers from portfolio, the image hero and
 * gallery from hospitality, the team grid from professional).
 */
const demoCopy: SectionCopy = {
  hero: hospitalityPreset.copy.hero,
  servicesGrid: professionalPreset.copy.servicesGrid,
  about: professionalPreset.copy.about,
  testimonials: portfolioPreset.copy.testimonials,
  gallery: hospitalityPreset.copy.gallery,
  faq: localServicePreset.copy.faq,
  pricing: portfolioPreset.copy.pricing,
  contactBand: hospitalityPreset.copy.contactBand,
  teamGrid: professionalPreset.copy.teamGrid,
  processSteps: localServicePreset.copy.processSteps,
  statsBand: localServicePreset.copy.statsBand,
  logoStrip: localServicePreset.copy.logoStrip,
  ctaBand: hospitalityPreset.copy.ctaBand,
  hoursMap: hospitalityPreset.copy.hoursMap,
  blogTeaser: { eyebrow: 'From the blog', heading: 'Recent posts', headingAccent: 'worth a read.' },
};

export default function PreviewPage() {
  return (
    <main className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-muted">Kitchen sink</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] tracking-tight">
          Section preview
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-fg/75 leading-relaxed">
          Every Sitekit section with sample content. Pick what you want, list the keys in{' '}
          <code>site.config.ts</code> → <code>sections</code>.
        </p>
      </div>

      {ALL_SECTION_KEYS.map(key => (
        <div key={key} className="border-y border-dashed border-border-token">
          <p className="mx-auto max-w-7xl px-6 lg:px-10 pt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-muted">
            {key} — components/sections/{COMPONENT_NAME[key]}.tsx
          </p>
          {registry[key](demoCopy)}
        </div>
      ))}
    </main>
  );
}
