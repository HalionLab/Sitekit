import type { Preset } from './types';

/**
 * Local service preset — Summit Services, a Denver HVAC/plumbing shop.
 *
 * This is the same content as the shipped `site.config.ts`; the config was
 * written first and this preset restates it so the wizard can regenerate it.
 * Keep the two in sync when either changes.
 */
export const localServicePreset: Preset = {
  key: 'local-service',
  label: 'Local service business',
  description: 'Trades and home services — HVAC, plumbing, cleaning, landscaping, pest control.',

  sections: [
    'hero',
    'logoStrip',
    'servicesGrid',
    'about',
    'processSteps',
    'statsBand',
    'testimonials',
    'faq',
    'contactBand',
    'hoursMap',
  ],

  copy: {
    hero: {
      eyebrow: 'Denver, CO · Licensed & insured',
      heading: 'Heating, cooling, and plumbing',
      headingAccent: 'done right the first time.',
      sub: 'Same-week scheduling for Denver homeowners who are tired of vague estimates and no-shows. One call gets you a flat-rate quote and a crew that actually shows up.',
      primaryCta: { label: 'Get a Free Quote', href: '/contact' },
      secondaryCta: { label: 'Call (555) 010-0100', href: 'tel:+15550100100' },
      note: 'No obligation. No pushy sales pitch.',
      highlights: {
        title: 'Why homeowners call us',
        items: [
          'Licensed & insured',
          'Upfront flat-rate quotes',
          'Same-week scheduling',
          '12-month workmanship guarantee',
        ],
      },
    },
    logoStrip: {
      label: 'Brands we service',
      logos: [
        { src: '/logos/brand-1.svg', alt: 'Carrier' },
        { src: '/logos/brand-2.svg', alt: 'Trane' },
        { src: '/logos/brand-3.svg', alt: 'Rheem' },
        { src: '/logos/brand-4.svg', alt: 'Bradford White' },
        { src: '/logos/brand-5.svg', alt: 'Kohler' },
      ],
    },
    servicesGrid: {
      eyebrow: 'What we do',
      heading: 'Full-service HVAC & plumbing',
      headingAccent: 'for the whole house.',
      sub: 'Repair, install, and maintain the systems that keep a Denver home running — heating, cooling, and everything with a pipe attached.',
    },
    about: {
      eyebrow: 'About Summit Services',
      heading: 'Local, licensed,',
      headingAccent: 'and easy to reach.',
      paragraphs: [
        "Summit Services has been fixing furnaces, air conditioners, and pipes across the Denver metro for over 15 years. We're a local crew, not a franchise call center — the technician who quotes the job is the one who shows up to do it.",
        "We built the business around the two things homeowners complain about most with contractors: not knowing the price until the invoice, and not knowing when — or if — anyone is coming. Every job gets a flat-rate quote up front and a scheduled window we keep.",
      ],
      bullets: {
        label: "What we don't do",
        items: [
          'No commission pressure',
          'No surprise line items',
          'No bait-and-switch coupons',
          'No disappearing after install',
        ],
      },
    },
    processSteps: {
      eyebrow: 'How it works',
      heading: 'From call to clean walkthrough',
      steps: [
        {
          title: 'Call or book online',
          description: 'Tell us what\'s going on. Most jobs get a same-week appointment window.',
        },
        {
          title: 'Flat-rate quote',
          description: 'A licensed tech diagnoses the issue on site and gives you one price before any work starts.',
        },
        {
          title: 'The work, done clean',
          description: 'We protect floors and fixtures, do the job, and haul away the old parts.',
        },
        {
          title: 'Walkthrough & guarantee',
          description: 'We walk the fix with you and back it with a 12-month workmanship guarantee.',
        },
      ],
    },
    statsBand: {
      heading: 'Numbers that matter',
      stats: [
        { value: '15+ yrs', label: 'In business' },
        { value: '4.9★', label: 'Average review' },
        { value: '3,400+', label: 'Jobs completed' },
        { value: '<24h', label: 'Typical response' },
      ],
      footnote: 'Placeholder numbers — replace with yours.',
    },
    testimonials: {
      eyebrow: 'What neighbors say',
      heading: 'Testimonials',
      items: [
        {
          quote: "Furnace died on the coldest night of the year and they had someone out the next morning. Flat rate, no surprises, fixed in an hour.",
          name: 'Rachel',
          role: 'Washington Park',
        },
        {
          quote: "Re-piped half our house after a slab leak. They walked us through every step and the price didn't move from the quote.",
          name: 'Marcus',
          role: 'Highlands',
        },
        {
          quote: "We've used them for AC tune-ups two years running. Same tech both times, shows up when he says he will.",
          name: 'Priya',
          role: 'Stapleton',
        },
      ],
    },
    faq: {
      eyebrow: 'Questions',
      heading: 'Frequently asked questions',
      items: [
        {
          q: 'What areas do you service?',
          a: 'Denver, Aurora, Lakewood, Arvada, Littleton, and Centennial. Not sure if you\'re in range? Call us and we\'ll tell you straight away.',
        },
        {
          q: 'How does pricing work?',
          a: 'Every job gets a flat-rate quote before we start, based on an on-site diagnosis. No hourly surprises and no charge for the estimate itself.',
        },
        {
          q: 'Do you handle emergencies?',
          a: 'Yes — call the number above. Most emergency calls (no heat, active leaks) get a same-day or next-morning window.',
        },
        {
          q: 'What brands do you service?',
          a: 'Most major HVAC and plumbing brands, including Carrier, Trane, Rheem, Bradford White, and Kohler, plus older systems from prior installers.',
        },
        {
          q: 'What does the guarantee cover?',
          a: 'Every repair and installation is backed by a 12-month workmanship guarantee — if something we did fails, we come back and fix it at no charge.',
        },
      ],
    },
    contactBand: {
      eyebrow: 'Get in touch',
      heading: 'Ready when you are',
      sub: 'Tell us what\'s going on and we\'ll get back to you with a free, no-obligation quote — usually within one business day.',
      formSource: 'quote',
    },
    hoursMap: {
      eyebrow: 'Hours & location',
      heading: 'Visit or call us',
    },
  },

  sampleBusiness: {
    services: [
      {
        name: 'Heating repair & installation',
        description: 'Furnace and heat pump repair, tune-ups, and full system replacement.',
        href: '/#services',
      },
      {
        name: 'Cooling & AC service',
        description: 'AC repair, seasonal tune-ups, and central air installation.',
        href: '/#services',
      },
      {
        name: 'Plumbing repair',
        description: 'Leaks, clogs, fixture repair, and re-piping for older Denver homes.',
        href: '/#services',
      },
      {
        name: 'Drain cleaning',
        description: 'Camera inspection and hydro-jetting for stubborn or recurring clogs.',
        href: '/#services',
      },
      {
        name: 'Water heater installation',
        description: 'Tank and tankless water heater replacement, same-week install.',
        href: '/#services',
      },
    ],
    schemaType: 'LocalBusiness',
  },

  nav: [
    { href: '/#services', label: 'Services' },
    { href: '/#about', label: 'About' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ],

  cta: {
    primary: { label: 'Get a Free Quote', href: '/contact' },
    secondary: { label: 'Call (555) 010-0100', href: 'tel:+15550100100' },
  },
};
