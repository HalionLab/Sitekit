import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { renderLegal } from '@/lib/legal/render';
import { renderMarkdown } from '@/lib/markdown/render';
import { sharedOpenGraph } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
  openGraph: {
    ...sharedOpenGraph,
    type: 'website',
    url: '/terms',
    title: 'Terms of Service',
  },
};

export default async function TermsPage() {
  const template = await readFile(path.join(process.cwd(), 'content/legal/terms.md'), 'utf8');
  // renderLegal substitutes placeholders and strips the template's leading
  // disclaimer comment (see lib/legal/render.ts) so it never reaches renderMarkdown.
  const body = renderLegal(template);
  const lastUpdated = renderLegal('{{date}}');

  return (
    <main className="bg-surface">
      <article className="mx-auto max-w-3xl px-6 py-24 lg:px-0">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-muted">
          Last updated {lastUpdated}
        </p>
        <div className="prose-blog mt-12">{renderMarkdown(body)}</div>
      </article>
    </main>
  );
}
