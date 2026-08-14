import { site } from '@/site.config';
import { ContactForm } from '@/components/marketing/ContactForm';
import { DisplayGradient } from '@/components/ui/DisplayGradient';
import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { ContactBandCopy, DayKey } from '@/lib/config/types';

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

export function ContactBand({ copy }: { copy: ContactBandCopy }) {
  const { business } = site;

  return (
    <section id="contact" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7">
          {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
            {copy.heading}{' '}
            {copy.headingAccent && <DisplayGradient>{copy.headingAccent}</DisplayGradient>}
          </h2>
          <p className="mt-6 max-w-xl text-lg text-fg/75 leading-relaxed">{copy.sub}</p>

          <div className="mt-10 max-w-xl">
            <ContactForm source={copy.formSource ?? 'contact'} />
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-surface-inverse text-fg-inverse p-8">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg-inverse/55">Reach us directly</p>

            <dl className="mt-6 space-y-5">
              {business.phone && (
                <div>
                  <dt className="text-xs text-fg-inverse/55">Phone</dt>
                  <dd className="mt-1">
                    <a href={`tel:${business.phone}`} className="text-lg font-medium hover:text-accent-alt">
                      {business.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-inverse/55">Email</dt>
                <dd className="mt-1">
                  <a href={`mailto:${business.email}`} className="break-all text-lg font-medium hover:text-accent-alt">
                    {business.email}
                  </a>
                </dd>
              </div>
              {formatAddress() && (
                <div>
                  <dt className="text-xs text-fg-inverse/55">Address</dt>
                  <dd className="mt-1 text-fg-inverse/85">{formatAddress()}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8 border-t border-fg-inverse/15 pt-6">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg-inverse/55">Hours</p>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {DAY_ORDER.map(day => (
                    <tr key={day} className="border-t border-fg-inverse/10 first:border-t-0">
                      <td className="py-1.5 text-fg-inverse/70">{DAY_LABELS[day]}</td>
                      <td className="py-1.5 text-right text-fg-inverse">
                        {business.hours[day] === 'closed' ? 'Closed' : business.hours[day]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
