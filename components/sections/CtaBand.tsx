import { CTAButton } from '@/components/ui/CTAButton';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import type { CtaBandCopy } from '@/lib/config/types';

export function CtaBand({ copy }: { copy: CtaBandCopy }) {
  return (
    <section className="bg-surface-inverse text-fg-inverse">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.02] tracking-tight">
              {copy.heading}{' '}
              {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
            </h2>
            {copy.sub && <p className="mt-6 max-w-xl text-fg-inverse/75 text-lg leading-relaxed">{copy.sub}</p>}
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <CTAButton href={copy.cta.href} size="lg">
              {copy.cta.label}
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
