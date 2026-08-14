import { site } from '@/site.config';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { DayKey, HoursMapCopy } from '@/lib/config/types';

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function formatAddress(): string | null {
  if (!site.business.address) return null;
  const { street, city, region, postalCode } = site.business.address;
  return `${street}, ${city}, ${region} ${postalCode}`;
}

function directionsUrl(address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export function HoursMap({ copy }: { copy: HoursMapCopy }) {
  const { business } = site;

  return (
    <section id="hours" className="bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-6">
          {copy.eyebrow && <EyebrowLabel tone="accent-alt">{copy.eyebrow}</EyebrowLabel>}
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
            {copy.heading}
          </h2>

          <table className="mt-10 w-full max-w-sm text-sm">
            <tbody>
              {DAY_ORDER.map(day => {
                const hours = business.hours[day];
                const closed = hours === 'closed';
                return (
                  <tr key={day} className="border-t border-border-token first:border-t-0">
                    <td className="py-2.5 text-fg/80">{DAY_LABELS[day]}</td>
                    <td className={`py-2.5 text-right ${closed ? 'text-fg-muted' : 'text-fg'}`}>
                      {closed ? 'Closed' : hours}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-6">
          {copy.mapEmbedUrl ? (
            <iframe
              src={copy.mapEmbedUrl}
              title="Map"
              loading="lazy"
              className="w-full aspect-[4/3] rounded-2xl border-0"
            />
          ) : formatAddress() ? (
            <div className="rounded-2xl bg-surface border border-border-token p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg-muted">Address</p>
              <p className="mt-3 text-lg text-fg">{formatAddress()}</p>
              <a
                href={directionsUrl(formatAddress() as string)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-accent font-medium hover:text-accent-alt"
              >
                Get directions
                <span aria-hidden>→</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
