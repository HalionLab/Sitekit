import { site } from '@/site.config';
import { CTAButton } from '@/components/ui/CTAButton';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { PricingCopy } from '@/lib/config/types';

export function Pricing({ copy }: { copy: PricingCopy }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>
        {copy.sub && <p className="mt-6 max-w-xl text-lg text-fg/75 leading-relaxed">{copy.sub}</p>}

        <div className="mt-14 grid lg:grid-cols-3 gap-6">
          {copy.tiers.map(tier => {
            const cta = tier.cta ?? site.cta.primary;
            return (
              <div
                key={tier.name}
                data-featured={tier.featured ? '' : undefined}
                className={`rounded-2xl p-8 flex flex-col ${
                  tier.featured
                    ? 'bg-surface-inverse text-fg-inverse'
                    : 'bg-surface border border-border-token'
                }`}
              >
                {tier.featured && (
                  <span className="self-start rounded-full bg-accent px-3 py-1 font-mono text-[10px] tracking-[0.15em] uppercase text-accent-contrast">
                    Most popular
                  </span>
                )}

                <h3 className="mt-4 font-display text-2xl">{tier.name}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${tier.featured ? 'text-fg-inverse/70' : 'text-fg/70'}`}>
                  {tier.description}
                </p>

                <p className="mt-6 font-display text-5xl">
                  {tier.price}
                  {tier.unit && <span className="ml-1 font-mono text-sm align-top opacity-60">/{tier.unit}</span>}
                </p>

                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3">
                      <span aria-hidden className={tier.featured ? 'text-accent-alt' : 'text-accent'}>
                        ✓
                      </span>
                      <span className={tier.featured ? 'text-fg-inverse/85' : 'text-fg/80'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <CTAButton href={cta.href} variant={tier.featured ? 'primary' : 'ghost'} className="w-full">
                    {cta.label}
                  </CTAButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
