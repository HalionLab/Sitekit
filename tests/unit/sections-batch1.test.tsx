// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { StatsBand } from '@/components/sections/StatsBand';
import { CtaBand } from '@/components/sections/CtaBand';

vi.mock('@/components/marketing/ContactForm', () => ({
  ContactForm: ({ source }: { source?: string }) => <div data-testid="contact-form">{source}</div>,
}));

afterEach(cleanup);

describe('Hero', () => {
  it('renders heading, sub, and CTAs', () => {
    render(
      <Hero
        copy={{
          heading: 'Plumbing',
          headingAccent: 'done right.',
          sub: 'Serving Denver.',
          primaryCta: { label: 'Quote', href: '/contact' },
          highlights: { title: 'Why us', items: ['Licensed', 'Insured'] },
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Plumbing');
    expect(screen.getByText('Serving Denver.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quote/ })).toHaveAttribute('href', '/contact');
    expect(screen.getByText('Licensed')).toBeInTheDocument();
  });
});

describe('About', () => {
  it('renders heading, paragraphs, and bullets', () => {
    render(
      <About
        copy={{
          heading: 'Local,',
          headingAccent: 'and easy to reach.',
          paragraphs: ['We fix things.'],
          bullets: { label: "What we don't do", items: ['No surprises'] },
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Local,');
    expect(screen.getByText('We fix things.')).toBeInTheDocument();
    expect(screen.getByText('No surprises')).toBeInTheDocument();
  });
});

describe('StatsBand', () => {
  it('renders stats values and labels', () => {
    render(
      <StatsBand
        copy={{
          heading: 'Numbers that matter',
          stats: [{ value: '15+ yrs', label: 'In business', src: 'Internal · 2026' }],
          footnote: 'Placeholder numbers.',
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Numbers that matter');
    expect(screen.getByText('15+ yrs')).toBeInTheDocument();
    expect(screen.getByText('In business')).toBeInTheDocument();
    expect(screen.getByText('Placeholder numbers.')).toBeInTheDocument();
  });
});

describe('CtaBand', () => {
  it('renders heading and cta link', () => {
    render(
      <CtaBand
        copy={{
          heading: 'Ready when you are',
          headingAccent: 'Call today.',
          sub: 'Free quotes.',
          cta: { label: 'Get a Quote', href: '/contact' },
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ready when you are');
    expect(screen.getByRole('link', { name: /Get a Quote/ })).toHaveAttribute('href', '/contact');
  });
});

describe('ContactBand', () => {
  it('renders heading, sub, and the contact form with source', async () => {
    const { ContactBand } = await import('@/components/sections/ContactBand');
    render(
      <ContactBand
        copy={{
          heading: 'Ready when you are',
          sub: "Tell us what's going on.",
          formSource: 'quote',
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ready when you are');
    expect(screen.getByText("Tell us what's going on.")).toBeInTheDocument();
    expect(screen.getByTestId('contact-form')).toHaveTextContent('quote');
  });
});
