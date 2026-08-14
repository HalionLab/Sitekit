import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { TestimonialsCopy } from '@/lib/config/types';

export function Testimonials({ copy }: { copy: TestimonialsCopy }) {
  return (
    <section className="bg-surface-inverse text-fg-inverse">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel tone="accent-alt">{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {copy.items.map(item => (
            <div key={item.name + item.quote} className="rounded-2xl bg-surface-inverse-alt p-7">
              <span aria-hidden className="block font-display text-6xl leading-none text-accent">
                &ldquo;
              </span>
              <p className="mt-2 font-display text-xl italic leading-snug">{item.quote}</p>
              <p className="mt-6 font-mono text-xs tracking-[0.1em] uppercase text-fg-inverse/55">
                {item.name}
                {item.role && <span> · {item.role}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
