import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { ProcessStepsCopy } from '@/lib/config/types';

export function ProcessSteps({ copy }: { copy: ProcessStepsCopy }) {
  return (
    <section className="bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel tone="accent-alt">{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {copy.steps.map((step, i) => (
            <div key={step.title} className="border-t border-border-token pt-6">
              <p className="font-display text-5xl text-accent-alt">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-4 font-display text-xl">{step.title}</h3>
              <p className="mt-3 text-fg/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
