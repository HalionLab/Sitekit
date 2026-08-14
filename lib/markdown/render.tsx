/* eslint-disable @next/next/no-img-element -- markdown bodies carry arbitrary remote
   images (Supabase Storage) with unknown dimensions; next/image doesn't fit free-form
   author content. Raw <img> with loading="lazy" is the right tool here. */
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const MEDIA_PREFIX = '/storage/v1/object/public/media/';

/**
 * Resolve an image `src`. Absolute URLs (`https://…`, `//…`) and root-relative
 * paths (`/foo.png`) pass through untouched. A bare path (e.g. `seed/cover.png`)
 * is treated as a Supabase Storage media key and resolved against the public
 * media bucket on NEXT_PUBLIC_SUPABASE_URL. With no base configured, the bare
 * path is returned unchanged.
 */
function resolveMediaUrl(src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return src;
  const key = src.replace(/^media\//, '');
  return `${base}${MEDIA_PREFIX}${key}`;
}

const components: Components = {
  img: ({ src, alt, title }) => {
    const resolved = typeof src === 'string' ? resolveMediaUrl(src) : undefined;
    return <img src={resolved} alt={alt ?? ''} title={title} loading="lazy" />;
  },
  a: ({ href, title, children }) => {
    const isExternal = !!href && /^(https?:)?\/\//.test(href);
    return (
      <a
        href={href}
        title={title}
        {...(isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      >
        {children}
      </a>
    );
  },
};

/**
 * Render a markdown string to React nodes for server rendering. GFM tables and
 * task lists are supported; headings get slug ids plus a wrapping anchor.
 */
export function renderMarkdown(md: string) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
      components={components}
    >
      {md}
    </ReactMarkdown>
  );
}
