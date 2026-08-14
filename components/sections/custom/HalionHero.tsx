import Link from 'next/link';
import { defineCustomSection } from './define';
import { ParticleCanvas } from './ParticleCanvas';
import { asRecord, reqCta, reqString } from './copy-utils';

interface HalionHeroCopy {
  eyebrow: string;
  heading: string;
  sub: string;
  image: { src: string; alt: string };
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

function HalionHero({ copy }: { copy: HalionHeroCopy }) {
  return (
    <section className="relative flex min-h-[760px] items-center justify-center overflow-hidden border-b border-border-token/60">
      <ParticleCanvas />
      {/* blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(color-mix(in_srgb,var(--color-fg)_2.5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-fg)_2.5%,transparent)_1px,transparent_1px)] bg-[size:46px_46px]"
      />
      {/* vignette */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[radial-gradient(120%_95%_at_50%_40%,transparent_30%,var(--color-surface)_100%)]"
      />

      <div className="relative z-[2] flex max-w-[860px] flex-col items-center px-6 pb-20 pt-16 text-center lg:px-10">
        <div className="relative mb-9 flex items-center justify-center">
          <div
            aria-hidden
            className="absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-fg)_16%,transparent)_0%,color-mix(in_srgb,var(--color-fg)_4%,transparent)_46%,transparent_70%)]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand mark, SVG */}
          <img
            src={copy.image.src}
            alt={copy.image.alt}
            width={300}
            height={300}
            className="relative block drop-shadow-[0_0_30px_color-mix(in_srgb,var(--color-fg)_25%,transparent)]"
          />
        </div>

        <div className="flex items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.2em] text-fg">
          <span aria-hidden className="h-px w-[26px] bg-fg/45" />
          {copy.eyebrow}
          <span aria-hidden className="h-px w-[26px] bg-fg/45" />
        </div>

        <h1 className="mt-7 max-w-[780px] font-display text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-fg">
          {copy.heading}
        </h1>
        <p className="mt-7 max-w-[550px] text-lg font-light leading-relaxed text-fg-muted">
          {copy.sub}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3.5">
          <Link
            href={copy.primaryCta.href}
            className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-contrast transition hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
          >
            {copy.primaryCta.label}&nbsp;→
          </Link>
          <Link
            href={copy.secondaryCta.href}
            className="rounded-full border border-border-token bg-surface-inverse px-7 py-3 text-sm font-medium text-fg transition hover:border-fg/25 hover:bg-surface-inverse-alt"
          >
            {copy.secondaryCta.label}&nbsp;→
          </Link>
        </div>
      </div>
    </section>
  );
}

export const halionHero = defineCustomSection<HalionHeroCopy>({
  Component: HalionHero,
  validateCopy(raw) {
    const ctx = 'halionHero';
    const o = asRecord(ctx, raw);
    const image = asRecord(`${ctx}.image`, o.image);
    return {
      eyebrow: reqString(ctx, o, 'eyebrow'),
      heading: reqString(ctx, o, 'heading'),
      sub: reqString(ctx, o, 'sub'),
      image: { src: reqString(`${ctx}.image`, image, 'src'), alt: reqString(`${ctx}.image`, image, 'alt') },
      primaryCta: reqCta(ctx, o, 'primaryCta'),
      secondaryCta: reqCta(ctx, o, 'secondaryCta'),
    };
  },
});
