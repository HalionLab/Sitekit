import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/site.config';
import { features } from '@/lib/config/features';
import { monogram } from '@/lib/brand';
import { CTAButton } from '@/components/ui/CTAButton';

/** Nav entries pointing at gated routes (currently just `/blog`) disappear when their feature is off. */
const nav = site.nav.filter(item => features.blog || !item.href.startsWith('/blog'));

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-surface/80 border-b border-fg/8">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          {site.logo ? (
            <Image src={site.logo.src} alt={site.logo.alt} width={site.logo.width} height={site.logo.height} />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-inverse text-fg-inverse font-mono text-[10px] tracking-wider">
              {monogram(site.name)}
            </span>
          )}
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg">{site.name}</span>
            {site.tagline.length < 30 && (
              <span className="font-mono text-[10px] tracking-[0.18em] text-fg/55 uppercase mt-0.5">{site.tagline}</span>
            )}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 font-body text-sm text-fg">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">{item.label}</Link>
          ))}
        </nav>

        <CTAButton href={site.cta.primary.href} size="md">{site.cta.primary.label}</CTAButton>
      </div>
    </header>
  );
}
