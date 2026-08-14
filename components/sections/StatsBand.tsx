import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { StatsBandCopy } from '@/lib/config/types';

export function StatsBand({ copy }: { copy: StatsBandCopy }) {
  return (
    <section className="bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel tone="accent-alt">{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}{' '}
          {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-fg/10 border-t border-b border-fg/10">
          {copy.stats.map(s => (
            <div key={s.label} className="px-6 py-8">
              <p className="font-display text-6xl text-fg">{s.value}</p>
              <p className="mt-5 text-fg/80 text-sm leading-relaxed">{s.label}</p>
              {s.src && (
                <p className="mt-5 font-mono text-[10px] tracking-[0.22em] uppercase text-accent">{s.src}</p>
              )}
            </div>
          ))}
        </div>

        {copy.footnote && (
          <p className="mt-10 max-w-3xl text-fg/55 text-sm leading-relaxed">{copy.footnote}</p>
        )}
      </div>
    </section>
  );
}
