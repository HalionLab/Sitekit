import Link from 'next/link';
import { defineCustomSection } from './define';
import { asRecord, reqArray, reqCta, reqString } from './copy-utils';

interface Entry {
  date: string;
  tag: string;
  title: string;
  href: string;
  /** first/most-recent entry gets the glowing dot */
  highlight?: boolean;
}

interface HalionBuildLogCopy {
  eyebrow: string;
  heading: string;
  sub: string;
  cta: { label: string; href: string };
  entries: Entry[];
}

function HalionBuildLog({ copy }: { copy: HalionBuildLogCopy }) {
  return (
    <section id="buildlog" className="border-y border-border-token/60 bg-surface-alt">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[380px_1fr] lg:gap-20 lg:px-10 lg:py-32">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
            <span aria-hidden className="h-px w-6 bg-fg/45" />
            {copy.eyebrow}
          </div>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,2.875rem)] font-medium leading-[1.05] tracking-[-0.035em] text-fg">
            {copy.heading}
          </h2>
          <p className="mt-4 text-[17px] font-light leading-relaxed text-fg-muted">{copy.sub}</p>
          <Link
            href={copy.cta.href}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-token bg-surface-inverse px-5 py-2.5 text-[13.5px] text-fg transition hover:border-fg/25"
          >
            {copy.cta.label}&nbsp;→
          </Link>
        </div>

        <div className="border-l border-border-token pl-10">
          {copy.entries.map((entry, i) => (
            <Link
              key={entry.title}
              href={entry.href}
              className={`group relative block ${i === copy.entries.length - 1 ? '' : 'pb-8'}`}
            >
              <span
                aria-hidden
                className={`absolute -left-[45px] top-1.5 h-[9px] w-[9px] rounded-full ${
                  entry.highlight
                    ? 'bg-accent shadow-[0_0_0_4px_var(--color-surface-alt),0_0_10px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]'
                    : 'border border-fg/20 bg-surface-inverse'
                }`}
              />
              <div className="flex items-center gap-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-fg-muted/70">
                {entry.date}
                <span aria-hidden className="text-fg/20">·</span>
                <span className={entry.highlight ? 'text-fg' : 'text-fg-muted'}>{entry.tag}</span>
              </div>
              <div className="mt-2 text-lg text-fg transition group-hover:text-fg/80">{entry.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const halionBuildLog = defineCustomSection<HalionBuildLogCopy>({
  Component: HalionBuildLog,
  validateCopy(raw) {
    const ctx = 'halionBuildLog';
    const o = asRecord(ctx, raw);
    const entries = reqArray(ctx, o, 'entries').map((e, i) => {
      const ec = `${ctx}.entries[${i}]`;
      const er = asRecord(ec, e);
      return {
        date: reqString(ec, er, 'date'),
        tag: reqString(ec, er, 'tag'),
        title: reqString(ec, er, 'title'),
        href: reqString(ec, er, 'href'),
        highlight: er.highlight === true,
      };
    });
    return {
      eyebrow: reqString(ctx, o, 'eyebrow'),
      heading: reqString(ctx, o, 'heading'),
      sub: reqString(ctx, o, 'sub'),
      cta: reqCta(ctx, o, 'cta'),
      entries,
    };
  },
});
