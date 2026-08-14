import { site } from '@/site.config';
import { CTAButton } from '@/components/ui/CTAButton';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { HeroCopy } from '@/lib/config/types';

export function Hero({ copy }: { copy: HeroCopy }) {
  const primaryCta = copy.primaryCta ?? site.cta.primary;
  const secondaryCta = copy.secondaryCta ?? site.cta.secondary;
  const hasAside = Boolean(copy.image || copy.highlights);

  return (
    <section className="relative">
      <div
        className={`mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-24 ${
          hasAside ? 'grid lg:grid-cols-12 gap-12 items-start' : ''
        }`}
      >
        <div className={hasAside ? 'lg:col-span-7' : 'max-w-3xl'}>
          {copy.eyebrow && (
            <div className="mb-8">
              <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>
            </div>
          )}

          <h1 className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.98] tracking-tight text-fg">
            {copy.heading}{' '}
            {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
          </h1>

          <p className="mt-8 max-w-xl text-lg text-fg/75 leading-relaxed">{copy.sub}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {primaryCta && (
              <CTAButton href={primaryCta.href} size="lg">
                {primaryCta.label}
              </CTAButton>
            )}
            {secondaryCta && (
              <CTAButton href={secondaryCta.href} variant="ghost" size="lg">
                {secondaryCta.label}
              </CTAButton>
            )}
          </div>

          {copy.note && (
            <p className="mt-4 font-mono text-[11px] tracking-[0.22em] uppercase text-fg/45">{copy.note}</p>
          )}
        </div>

        {copy.image ? (
          <aside className="lg:col-span-5">
            <img
              src={copy.image.src}
              alt={copy.image.alt}
              className="w-full rounded-3xl object-cover aspect-[4/5]"
            />
          </aside>
        ) : copy.highlights ? (
          <aside className="lg:col-span-5">
            <div className="rounded-3xl bg-surface-inverse text-fg-inverse p-8 shadow-2xl">
              <p className="font-display text-2xl">{copy.highlights.title}</p>
              <ul className="mt-8 space-y-4">
                {copy.highlights.items.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span aria-hidden className="text-accent mt-0.5">✓</span>
                    <span className="text-fg-inverse/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
