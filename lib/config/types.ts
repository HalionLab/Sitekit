export type SectionKey =
  | 'hero' | 'servicesGrid' | 'about' | 'testimonials' | 'gallery' | 'faq'
  | 'pricing' | 'contactBand' | 'teamGrid' | 'processSteps' | 'statsBand'
  | 'logoStrip' | 'ctaBand' | 'hoursMap' | 'blogTeaser';

/**
 * Escape-hatch key for site-specific sections that aren't part of the built-in
 * library. `custom:<name>` resolves to a module in `components/sections/custom/`
 * (registered in its `index.ts`); its copy lives at `copy.custom[<name>]` and is
 * validated by the module's own `validateCopy`, not the closed shapes below.
 */
export type CustomSectionKey = `custom:${string}`;
export type AnySectionKey = SectionKey | CustomSectionKey;

export interface Cta { label: string; href: string }
export interface NavLink { href: string; label: string }
export interface Service { name: string; description: string; href?: string; price?: string }
export interface Address { street: string; city: string; region: string; postalCode: string; country: string }
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface BusinessInfo {
  legalName: string;
  /** E.164-ish, e.g. '+1-555-0100'. Omit for businesses with no public phone —
   * phone UI (footer, contact cards) and JSON-LD `telephone` disappear. */
  phone?: string;
  email: string;
  /** Omit for online-only businesses — address UI and JSON-LD `address`
   * disappear; `{{address}}` in legal templates resolves to ''. */
  address?: Address;
  hours: Record<DayKey, string>;   // '8:00-17:00' or 'closed'
  serviceAreas: string[];
  services: Service[];
  /** schema.org type emitted in JSON-LD. */
  schemaType: 'LocalBusiness' | 'ProfessionalService' | 'Organization';
  license?: string;
}

export interface HeroCopy {
  eyebrow?: string; heading: string; headingAccent?: string; sub: string;
  primaryCta?: Cta; secondaryCta?: Cta; note?: string;
  image?: { src: string; alt: string };
  /** Bullet highlights shown in the aside card when no image is given. */
  highlights?: { title: string; items: string[] };
}
export interface ServicesGridCopy { eyebrow?: string; heading: string; headingAccent?: string; sub?: string }
export interface AboutCopy { eyebrow?: string; heading: string; headingAccent?: string; paragraphs: string[]; bullets?: { label: string; items: string[] } }
export interface TestimonialsCopy { eyebrow?: string; heading: string; headingAccent?: string; items: { quote: string; name: string; role?: string }[] }
export interface GalleryCopy { eyebrow?: string; heading: string; images: { src: string; alt: string }[] }
export interface FaqCopy { eyebrow?: string; heading: string; headingAccent?: string; items: { q: string; a: string }[] }
export interface PricingCopy {
  eyebrow?: string; heading: string; headingAccent?: string; sub?: string;
  tiers: { name: string; price: string; unit?: string; description: string; features: string[]; cta?: Cta; featured?: boolean }[];
}
export interface ContactBandCopy { eyebrow?: string; heading: string; headingAccent?: string; sub: string; formSource?: 'contact' | 'quote' }
export interface TeamGridCopy { eyebrow?: string; heading: string; members: { name: string; role: string; photo?: string; bio?: string }[] }
export interface ProcessStepsCopy { eyebrow?: string; heading: string; headingAccent?: string; steps: { title: string; description: string }[] }
export interface StatsBandCopy { eyebrow?: string; heading: string; headingAccent?: string; stats: { value: string; label: string; src?: string }[]; footnote?: string }
export interface LogoStripCopy { label: string; logos: { src: string; alt: string }[] }
export interface CtaBandCopy { heading: string; headingAccent?: string; sub?: string; cta: Cta }
export interface HoursMapCopy { eyebrow?: string; heading: string; mapEmbedUrl?: string }
export interface BlogTeaserCopy { eyebrow?: string; heading: string; headingAccent?: string; limit?: number }

export interface SectionCopy {
  hero?: HeroCopy; servicesGrid?: ServicesGridCopy; about?: AboutCopy;
  testimonials?: TestimonialsCopy; gallery?: GalleryCopy; faq?: FaqCopy;
  pricing?: PricingCopy; contactBand?: ContactBandCopy; teamGrid?: TeamGridCopy;
  processSteps?: ProcessStepsCopy; statsBand?: StatsBandCopy; logoStrip?: LogoStripCopy;
  ctaBand?: CtaBandCopy; hoursMap?: HoursMapCopy; blogTeaser?: BlogTeaserCopy;
  /** Copy for `custom:<name>` sections, keyed by name; shape is owned and
   * validated by the matching module in `components/sections/custom/`. */
  custom?: Record<string, unknown>;
}

export interface SiteConfig {
  name: string; tagline: string; description: string;
  /** Canonical origin; NEXT_PUBLIC_SITE_URL overrides at runtime. */
  url: string;
  logo: { src: string; alt: string; width: number; height: number } | null;
  business: BusinessInfo;
  nav: NavLink[];
  footerLinks: NavLink[];
  social: Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok', string>>;
  cta: { primary: Cta; secondary?: Cta };
  sections: AnySectionKey[];
  copy: SectionCopy;
  features: { blog: boolean; cms: boolean; gatedDownload: boolean; analytics: boolean };
  analytics: { provider: 'plausible' | 'umami' | 'ga4' | 'none'; siteId?: string; scriptUrl?: string };
}
