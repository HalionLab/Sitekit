import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { AboutCopy } from '@/lib/config/types';

export function About({ copy }: { copy: AboutCopy }) {
  return (
    <section id="about" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7">
          {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
            {copy.heading}{' '}
            {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
          </h2>

          <div className="mt-10 space-y-5 text-lg text-fg/75 leading-relaxed max-w-xl">
            {copy.paragraphs.map(p => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        {copy.bullets && (
          <aside className="lg:col-span-5 lg:pt-20">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg/45">{copy.bullets.label}</p>
            <ul className="mt-4 divide-y divide-fg/10">
              {copy.bullets.items.map(item => (
                <li key={item} className="py-5 flex items-center gap-4">
                  <span aria-hidden className="text-accent">✕</span>
                  <span className="font-display italic text-2xl">{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}
