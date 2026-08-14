import Link from 'next/link';
import { defineCustomSection } from './define';
import { asRecord, copyFail, optString, reqArray, reqString } from './copy-utils';

interface Project {
  name: string;
  tagline: string;
  description: string;
  status: string;
  /** true renders the glowing "live" dot; false the hollow "in progress" dot */
  live: boolean;
  updated: string;
  href: string;
  previewLabel: string;
}

interface HalionProjectsCopy {
  eyebrow: string;
  heading: string;
  sub: string;
  projects: Project[];
}

const stripes =
  'bg-[repeating-linear-gradient(135deg,var(--color-surface-alt),var(--color-surface-alt)_9px,var(--color-surface-inverse)_9px,var(--color-surface-inverse)_18px)]';

function HalionProjects({ copy }: { copy: HalionProjectsCopy }) {
  return (
    <section id="projects" className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-10">
      <div className="max-w-[640px]">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
          <span aria-hidden className="h-px w-6 bg-fg/45" />
          {copy.eyebrow}
        </div>
        <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,2.875rem)] font-medium leading-[1.05] tracking-[-0.035em] text-fg">
          {copy.heading}
        </h2>
        <p className="mt-4 text-[17px] font-light leading-relaxed text-fg-muted">{copy.sub}</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {copy.projects.map(project => (
          <div
            key={project.name}
            className="rounded-[14px] border border-border-token bg-surface-inverse p-6 transition hover:border-fg/25 hover:shadow-[0_24px_48px_-24px_color-mix(in_srgb,var(--color-surface)_80%,transparent)]"
          >
            <div className={`relative h-[158px] overflow-hidden rounded-lg border border-border-token ${stripes}`}>
              <span className="absolute bottom-2.5 left-3 font-mono text-[9.5px] tracking-[0.1em] text-fg-muted/70">
                {project.previewLabel}
              </span>
            </div>

            <div className="mt-5 flex items-start justify-between gap-3">
              <h3 className="font-display text-[23px] font-medium tracking-[-0.02em] text-fg">{project.name}</h3>
              <span
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border-token px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] ${
                  project.live ? 'text-fg' : 'text-fg-muted'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    project.live
                      ? 'bg-accent shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]'
                      : 'border border-fg'
                  }`}
                />
                {project.status}
              </span>
            </div>

            <p className="mt-2.5 text-[15px] text-fg">{project.tagline}</p>
            <p className="mt-2.5 text-sm font-light leading-relaxed text-fg-muted">{project.description}</p>

            <div aria-hidden className="my-5 h-px bg-border-token/60" />

            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg-muted/70">
                {project.updated}
              </span>
              <Link href={project.href} className="text-[13px] text-fg-muted transition hover:text-fg">
                View Project&nbsp;→
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const halionProjects = defineCustomSection<HalionProjectsCopy>({
  Component: HalionProjects,
  validateCopy(raw) {
    const ctx = 'halionProjects';
    const o = asRecord(ctx, raw);
    const projects = reqArray(ctx, o, 'projects').map((p, i) => {
      const pc = `${ctx}.projects[${i}]`;
      const pr = asRecord(pc, p);
      if (typeof pr.live !== 'boolean') copyFail(pc, 'live must be a boolean');
      return {
        name: reqString(pc, pr, 'name'),
        tagline: reqString(pc, pr, 'tagline'),
        description: reqString(pc, pr, 'description'),
        status: reqString(pc, pr, 'status'),
        live: pr.live,
        updated: reqString(pc, pr, 'updated'),
        href: reqString(pc, pr, 'href'),
        previewLabel: optString(pc, pr, 'previewLabel') ?? 'preview',
      };
    });
    return {
      eyebrow: reqString(ctx, o, 'eyebrow'),
      heading: reqString(ctx, o, 'heading'),
      sub: reqString(ctx, o, 'sub'),
      projects,
    };
  },
});
