import type { Metadata } from 'next';
import { SITE, sharedOpenGraph } from '@/lib/seo/site';
import { site } from '@/site.config';
import { renderSections } from '@/components/sections/registry';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    ...sharedOpenGraph,
    type: 'website',
    url: '/',
    title: SITE.name,
    description: SITE.tagline,
  },
};

export default function HomePage() {
  return <main>{renderSections(site.sections, site.copy)}</main>;
}
