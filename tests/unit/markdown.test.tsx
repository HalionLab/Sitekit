// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderMarkdown } from '@/lib/markdown/render';

describe('renderMarkdown', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it('renders a heading', () => {
    const { container } = render(<>{renderMarkdown('## Hello')}</>);
    expect(container.querySelector('h2')?.textContent).toContain('Hello');
  });

  it('renders a link', () => {
    const { container } = render(<>{renderMarkdown('[click](https://example.com)')}</>);
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://example.com');
  });

  it('renders a code block with the language class', () => {
    const { container } = render(<>{renderMarkdown('```ts\nconst x = 1;\n```')}</>);
    const code = container.querySelector('code');
    expect(code?.className).toContain('language-ts');
  });

  it('renders a blockquote', () => {
    const { container } = render(<>{renderMarkdown('> quoted')}</>);
    expect(container.querySelector('blockquote')).toBeTruthy();
  });

  it('renders an image with src and alt', () => {
    const { container } = render(<>{renderMarkdown('![Sample](/img.png)')}</>);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/img.png');
    expect(img?.getAttribute('alt')).toBe('Sample');
  });

  it('resolves relative storage paths against NEXT_PUBLIC_SUPABASE_URL when configured', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    const { container } = render(<>{renderMarkdown('![sample](seed/img.png)')}</>);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/seed/img.png',
    );
  });

  it('adds id and anchor to headings', () => {
    const { container } = render(<>{renderMarkdown('## My Section')}</>);
    const h = container.querySelector('h2');
    expect(h?.id).toBe('my-section');
    // rehype-autolink-headings wraps the heading text with an anchor.
    expect(h?.querySelector('a')).toBeTruthy();
  });
});
