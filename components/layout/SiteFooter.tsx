import Link from 'next/link';
import { site } from '@/site.config';
import { features } from '@/lib/config/features';

/** Footer entries pointing at gated routes (currently just `/blog`) disappear when their feature is off. */
const footerLinks = site.footerLinks.filter(item => features.blog || !item.href.startsWith('/blog'));

function formatAddress(): string | null {
  if (!site.business.address) return null;
  const { street, city, region, postalCode } = site.business.address;
  return `${street}, ${city}, ${region} ${postalCode}`;
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export function SiteFooter() {
  const { business, social } = site;
  const socialEntries = Object.entries(social).filter(([, href]) => Boolean(href)) as [string, string][];

  return (
    <footer className="bg-surface-inverse text-fg-inverse">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display text-lg">{site.name}</p>
            <p className="mt-3 max-w-xs text-fg-inverse/70 text-sm leading-relaxed">{site.tagline}</p>
            {business.license && (
              <p className="mt-6 font-mono text-[10px] tracking-[0.18em] uppercase text-fg-inverse/45">
                {business.license}
              </p>
            )}
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
            {footerLinks.map(item => (
              <Link key={item.href} href={item.href} className="text-fg-inverse/75 hover:text-accent">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm">
            {business.phone && (
              <p>
                <a href={`tel:${business.phone}`} className="text-fg-inverse/85 hover:text-accent-alt">
                  {business.phone}
                </a>
              </p>
            )}
            <p className="mt-2 first:mt-0">
              <a href={`mailto:${business.email}`} className="break-all text-fg-inverse/85 hover:text-accent-alt">
                {business.email}
              </a>
            </p>
            {formatAddress() && <p className="mt-2 text-fg-inverse/70">{formatAddress()}</p>}
            {business.serviceAreas.length > 0 && (
              <p className="mt-4 text-fg-inverse/55 text-xs leading-relaxed">
                Serving {business.serviceAreas.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-20 border-t border-fg-inverse/15 pt-8 flex flex-wrap items-center justify-between gap-6 font-mono text-[11px] tracking-[0.18em] uppercase text-fg-inverse/55">
          <p>© {new Date().getFullYear()} {business.legalName}</p>
          {socialEntries.length > 0 && (
            <nav aria-label="Social" className="flex gap-6">
              {socialEntries.map(([key, href]) => (
                <a key={key} href={href} className="hover:text-accent">
                  {SOCIAL_LABELS[key] ?? key}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
