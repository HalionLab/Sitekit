import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { FaqCopy } from '@/lib/config/types';

export function Faq({ copy }: { copy: FaqCopy }) {
  return (
    <section id="faq" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>

        <div className="mt-14 max-w-3xl">
          {copy.items.map(item => (
            <details key={item.q} className="group border-b border-border-token py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl">
                <span>{item.q}</span>
                <span aria-hidden className="shrink-0 text-accent">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-4 text-fg/70 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
