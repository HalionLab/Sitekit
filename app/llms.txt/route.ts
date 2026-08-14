import { absoluteUrl } from '@/lib/seo/site';
import { site } from '@/site.config';

/**
 * llms.txt -- a machine-readable site summary for AI assistants and crawlers,
 * following the llmstxt.org spec: H1 title, blockquote summary, then markdown
 * sections of links with descriptions.
 *
 * Plain route handlers are dynamic by default in Next 16; force-static so this
 * is generated at build time and served from the static cache.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  const links = [
    `- [Homepage](${absoluteUrl('/')}): ${site.description}`,
    ...(site.features.blog
      ? [`- [Blog](${absoluteUrl('/blog')}): Articles and updates from ${site.name}`]
      : []),
    `- [Contact](${absoluteUrl('/contact')}): Get in touch with ${site.name}`,
  ].join('\n');

  const body = `# ${site.name}

> ${site.tagline} ${site.description}

## Content

${links}

## Machine-readable resources

- [Sitemap](${absoluteUrl('/sitemap.xml')}): All published URLs with last-modified dates
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
