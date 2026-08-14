import { site } from '@/site.config';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { ServicesGridCopy } from '@/lib/config/types';

export function ServicesGrid({ copy }: { copy: ServicesGridCopy }) {
  const services = site.business.services;

  return (
    <section id="services" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>
        {copy.sub && <p className="mt-6 max-w-xl text-lg text-fg/75 leading-relaxed">{copy.sub}</p>}

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => {
            const card = (
              <>
                <h3 className="font-display text-2xl">{service.name}</h3>
                <p className="mt-3 text-fg/70 leading-relaxed">{service.description}</p>
                {service.price && (
                  <p className="mt-5 font-mono text-xs tracking-[0.1em] uppercase text-accent">{service.price}</p>
                )}
                {service.href && (
                  <span aria-hidden className="mt-5 inline-block text-accent">→</span>
                )}
              </>
            );

            return service.href ? (
              <a
                key={service.name}
                href={service.href}
                className="rounded-2xl bg-surface border border-border-token p-6 transition hover:border-accent"
              >
                {card}
              </a>
            ) : (
              <div key={service.name} className="rounded-2xl bg-surface border border-border-token p-6">
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
