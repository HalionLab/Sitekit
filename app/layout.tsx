import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { env } from '@/lib/env';
import { SITE, siteOrigin, absoluteUrl, sharedOpenGraph, openingHours } from '@/lib/seo/site';
import { site } from '@/site.config';
import { Analytics } from '@/components/Analytics';
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css';

// sitekit:fonts-start
const body = Geist({ subsets: ['latin'], variable: '--font-g-body' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-g-mono' });
const display = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-g-display',
});
// sitekit:fonts-end

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: SITE.name, template: `%s -- ${SITE.name}` },
  description: site.description,
  // Site-wide OG defaults. Routes that define their own openGraph replace
  // this object entirely (shallow merge), so they spread sharedOpenGraph too.
  openGraph: {
    ...sharedOpenGraph,
    type: 'website',
    url: '/',
  },
  // Card type only; twitter title/description/images auto-fill from each
  // route's resolved openGraph.
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: env.googleSiteVerification(),
    other: env.bingSiteVerification()
      ? { 'msvalidate.01': env.bingSiteVerification() as string }
      : undefined,
  },
};

/** LocalBusiness schema, emitted site-wide from the root layout. */
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': site.business.schemaType,
  name: site.name,
  legalName: site.business.legalName,
  url: siteOrigin(),
  logo: absoluteUrl('/opengraph-image'),
  description: site.description,
  ...(site.business.phone ? { telephone: site.business.phone } : {}),
  email: site.business.email,
  ...(site.business.address
    ? {
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.business.address.street,
          addressLocality: site.business.address.city,
          addressRegion: site.business.address.region,
          postalCode: site.business.address.postalCode,
          addressCountry: site.business.address.country,
        },
      }
    : {}),
  areaServed: site.business.serviceAreas.map(name => ({ '@type': 'City', name })),
  openingHoursSpecification: openingHours(site.business.hours),
  sameAs: Object.values(site.social).filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} ${display.variable}`}>
      <body>
        {children}
        <JsonLd data={businessSchema} />
        <Analytics />
      </body>
    </html>
  );
}
