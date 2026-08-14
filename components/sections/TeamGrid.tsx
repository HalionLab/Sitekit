import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { TeamGridCopy } from '@/lib/config/types';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function TeamGrid({ copy }: { copy: TeamGridCopy }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {copy.members.map(member => (
            <div key={member.name}>
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full rounded-2xl object-cover aspect-square"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-accent-alt to-accent">
                  <span className="font-display text-4xl text-accent-contrast">{initials(member.name)}</span>
                </div>
              )}
              <h3 className="mt-5 font-display text-xl">{member.name}</h3>
              <p className="mt-1 font-mono text-xs tracking-[0.1em] uppercase text-fg/55">{member.role}</p>
              {member.bio && <p className="mt-3 text-fg/70 leading-relaxed">{member.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
