// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ServicesGrid } from '@/components/sections/ServicesGrid';
import { Testimonials } from '@/components/sections/Testimonials';
import { Faq } from '@/components/sections/Faq';
import { ProcessSteps } from '@/components/sections/ProcessSteps';
import { Pricing } from '@/components/sections/Pricing';
import { TeamGrid } from '@/components/sections/TeamGrid';
import { site } from '@/site.config';

afterEach(cleanup);

describe('ServicesGrid', () => {
  it('renders heading and services from site config', () => {
    render(<ServicesGrid copy={{ heading: 'What we do' }} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What we do');
    // ServicesGrid falls back to site.business.services — assert against the
    // live config, not a hardcoded string, so rebrands don't break the suite.
    expect(screen.getByText(site.business.services[0].name)).toBeInTheDocument();
  });
});

describe('Testimonials', () => {
  it('renders heading and quote cards', () => {
    render(
      <Testimonials
        copy={{
          heading: 'What customers say',
          items: [{ quote: 'Fast and friendly.', name: 'Jamie R.', role: 'Homeowner' }],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What customers say');
    expect(screen.getByText('Fast and friendly.')).toBeInTheDocument();
    expect(screen.getByText('Jamie R.')).toBeInTheDocument();
  });
});

describe('Faq', () => {
  it('renders heading and details/summary items', () => {
    const { container } = render(
      <Faq
        copy={{
          heading: 'Common questions',
          items: [{ q: 'Do you offer same-day service?', a: 'Yes, in most cases.' }],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Common questions');
    expect(screen.getByText('Do you offer same-day service?')).toBeInTheDocument();
    expect(container.querySelectorAll('details').length).toBe(1);
  });
});

describe('ProcessSteps', () => {
  it('renders heading and numbered steps', () => {
    render(
      <ProcessSteps
        copy={{
          heading: 'How it works',
          steps: [{ title: 'Call us', description: 'Tell us what is going on.' }],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('How it works');
    expect(screen.getByText('Call us')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
  });
});

describe('Pricing', () => {
  it('renders heading, tiers, and marks the featured tier', () => {
    const { container } = render(
      <Pricing
        copy={{
          heading: 'Simple pricing',
          tiers: [
            { name: 'Standard', price: '$99', description: 'Basic visit', features: ['One visit'] },
            {
              name: 'Pro',
              price: '$199',
              unit: 'mo',
              description: 'Ongoing coverage',
              features: ['Priority scheduling'],
              featured: true,
            },
          ],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Simple pricing');
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(container.querySelector('[data-featured]')).not.toBeNull();
  });
});

describe('TeamGrid', () => {
  it('renders heading and member names, with a monogram when no photo', () => {
    render(
      <TeamGrid
        copy={{
          heading: 'Meet the team',
          members: [{ name: 'Alex Rivera', role: 'Lead Technician' }],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Meet the team');
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
  });
});
