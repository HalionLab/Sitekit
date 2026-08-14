import type { LogoStripCopy } from '@/lib/config/types';

export function LogoStrip({ copy }: { copy: LogoStripCopy }) {
  return (
    <section className="bg-surface border-y border-border-token">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8 flex flex-wrap items-center gap-x-10 gap-y-5 justify-between">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-fg-muted shrink-0">
          {copy.label}
        </p>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          {copy.logos.map(logo => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative, grayscale-filtered brand marks; next/image adds no value here.
            <img
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              className="h-8 w-auto opacity-60 grayscale"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
