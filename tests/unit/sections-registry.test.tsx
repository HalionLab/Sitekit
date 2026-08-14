// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { renderSections, registry } from '@/components/sections/registry';
import { ALL_SECTION_KEYS } from '@/lib/config/validate';
import type { SectionCopy } from '@/lib/config/types';

vi.mock('@/components/marketing/ContactForm', () => ({
  ContactForm: ({ source }: { source?: string }) => <div data-testid="contact-form">{source}</div>,
}));

vi.mock('@/lib/content', () => ({
  contentSource: {
    listPosts: vi.fn().mockResolvedValue([]),
  },
}));

afterEach(cleanup);

const fixture: SectionCopy = {
  hero: {
    heading: 'Plumbing',
    sub: 'Serving Denver.',
  },
  faq: {
    heading: 'Frequently asked questions',
    items: [{ q: 'Do you offer same-day service?', a: 'Yes, in most cases.' }],
  },
};

describe('registry', () => {
  it('covers every ALL_SECTION_KEYS entry', () => {
    expect(Object.keys(registry).sort()).toEqual([...ALL_SECTION_KEYS].sort());
  });
});

describe('renderSections', () => {
  it('renders exactly the requested sections, in order', () => {
    render(<>{renderSections(['hero', 'faq'], fixture)}</>);
    const headings = screen.getAllByRole('heading', { level: 1 }).concat(
      screen.getAllByRole('heading', { level: 2 })
    );
    expect(headings).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Plumbing');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frequently asked questions');
  });

  it('renders sections in the order the keys are given', () => {
    const { container } = render(<>{renderSections(['faq', 'hero'], fixture)}</>);
    const headingTags = Array.from(container.querySelectorAll('h1, h2')).map(el => el.textContent);
    expect(headingTags[0]).toContain('Frequently asked questions');
    expect(headingTags[1]).toContain('Plumbing');
  });
});
