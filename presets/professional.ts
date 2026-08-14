import type { Preset } from './types';

/**
 * Professional services preset — Ledger & Lane, a small CPA firm.
 * Tone: credentialed and calm. Trust comes from the team, not from stats.
 */
export const professionalPreset: Preset = {
  key: 'professional',
  label: 'Professional services',
  description: 'Accountants, attorneys, consultants, agencies — expertise sold by the engagement.',

  sections: [
    'hero',
    'about',
    'servicesGrid',
    'processSteps',
    'teamGrid',
    'testimonials',
    'faq',
    'ctaBand',
    'contactBand',
  ],

  copy: {
    hero: {
      eyebrow: 'Portland, OR · CPA firm since 2009',
      heading: 'Accounting that answers',
      headingAccent: 'before you have to ask.',
      sub: 'We keep the books, file the returns, and flag what matters while there is still time to do something about it. Flat monthly fees, a named accountant, replies inside one business day.',
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
      secondaryCta: { label: 'Call (555) 010-0142', href: 'tel:+15550100142' },
      note: 'Free 30-minute intro call. No engagement letter required.',
      highlights: {
        title: 'What working with us looks like',
        items: [
          'A licensed CPA reviews every file',
          'Flat monthly fee, quoted before you sign',
          'One named contact, not a shared inbox',
          'Quarterly planning, not just April',
        ],
      },
    },
    about: {
      eyebrow: 'About Ledger & Lane',
      heading: 'A small firm',
      headingAccent: 'that stays small on purpose.',
      paragraphs: [
        'We opened in 2009 on a simple premise: when a business owner calls their accountant, they should get their accountant. Sixteen years later we still cap the client list so that stays true.',
        'Our clients are contractors, clinics, studios, and family-owned shops doing somewhere between $250K and $10M a year. We handle the compliance work that has to be right, and the planning work that makes next year cheaper. When something falls outside what we do well, we say so and point you somewhere better.',
      ],
      bullets: {
        label: 'How we work',
        items: [
          'Fixed fees, agreed in advance',
          'Replies within one business day',
          'Plain English, no jargon tax',
          'Your records stay yours, always',
        ],
      },
    },
    servicesGrid: {
      eyebrow: 'Services',
      heading: 'Compliance handled,',
      headingAccent: 'planning included.',
      sub: 'Four core engagements. Most clients start with one and add the others as the business grows into them.',
    },
    processSteps: {
      eyebrow: 'Working together',
      heading: 'What the first 90 days look like',
      headingAccent: 'from your side of the table.',
      steps: [
        {
          title: 'Intro call',
          description: 'Thirty minutes to hear where the business is, what has been filed, and what is keeping you up.',
        },
        {
          title: 'Scope and fixed quote',
          description: 'We put the engagement in writing: what we handle, what stays with you, what it costs each month.',
        },
        {
          title: 'Records cleanup',
          description: 'We reconcile the prior year, correct what needs correcting, and rebuild the chart of accounts properly.',
        },
        {
          title: 'A monthly rhythm',
          description: 'Books closed by the tenth, a one-page summary you will actually read, and a planning call each quarter.',
        },
      ],
    },
    teamGrid: {
      eyebrow: 'The team',
      heading: 'The people who will actually be on your file',
      members: [
        {
          name: 'Dana Lane',
          role: 'Partner, CPA',
          bio: 'Started the firm in 2009 after nine years in regional public accounting. Leads tax strategy for our construction and trades clients.',
        },
        {
          name: 'Ray Ledger',
          role: 'Partner, CPA',
          bio: 'Runs the advisory practice. Spent six years as a controller in manufacturing before moving to this side of the table.',
        },
        {
          name: 'Sofia Nakamura',
          role: 'Senior Accountant',
          bio: 'Handles monthly close for about forty clients. QuickBooks and Xero certified, and the person most clients email first.',
        },
        {
          name: 'Priya Raman',
          role: 'Payroll & Compliance Manager',
          bio: 'Twelve years in multi-state payroll, quarterly filings, and the envelopes nobody wants to open.',
        },
      ],
    },
    testimonials: {
      eyebrow: 'Client feedback',
      heading: 'The part we hear',
      headingAccent: 'most often.',
      items: [
        {
          quote: 'Our last accountant billed for every phone call, so we stopped calling. Ledger & Lane quoted a flat fee and I have never once hesitated to pick up the phone.',
          name: 'Elena',
          role: 'Owner, three-location dental practice',
        },
        {
          quote: 'They found an S-corp election we should have made two years earlier and walked us through fixing it. That one conversation paid for the year.',
          name: 'Tom',
          role: 'General contractor, 14 employees',
        },
        {
          quote: 'Books close by the tenth. Every month. I know what the business did before I have to decide what it does next.',
          name: 'Aisha',
          role: 'Founder, design studio',
        },
      ],
    },
    faq: {
      eyebrow: 'Questions',
      heading: 'What people ask',
      headingAccent: 'on the first call.',
      items: [
        {
          q: 'Do you work with businesses outside Oregon?',
          a: 'Yes. We file in all fifty states and handle multi-state payroll and nexus questions regularly. Most of our clients have never been to the office.',
        },
        {
          q: 'What does it cost?',
          a: 'Monthly bookkeeping engagements start at $450 and tax-only work starts at $900 per return. You get a fixed quote after the intro call, before anything is signed.',
        },
        {
          q: 'Can you clean up books that are badly behind?',
          a: 'That is how roughly a third of our engagements begin. We scope the catch-up work separately so you can see what the backlog costs before committing to ongoing service.',
        },
        {
          q: 'Will I have one point of contact?',
          a: 'Yes. Every client gets a named accountant plus a partner who reviews the work. Nothing routes through a general inbox.',
        },
        {
          q: 'What happens if the IRS sends us a notice?',
          a: 'Forward it and stop worrying about it. Responding to notices on returns we prepared is part of your engagement, not a separate bill.',
        },
      ],
    },
    ctaBand: {
      heading: 'Tax season is easier',
      headingAccent: 'when it starts in June.',
      sub: 'Book a free thirty-minute call. We will tell you what we would do differently, whether or not you hire us.',
      cta: { label: 'Book a Consultation', href: '/contact' },
    },
    contactBand: {
      eyebrow: 'Get in touch',
      heading: 'Let us take a look',
      headingAccent: 'at your numbers.',
      sub: 'Send a note about where the business is today. You will hear back within one business day with next steps and a straight answer on whether we are the right fit.',
      formSource: 'contact',
    },
  },

  sampleBusiness: {
    services: [
      {
        name: 'Tax preparation',
        description: 'Federal, state, and multi-state returns for the business and its owners, filed on time and reviewed by a partner.',
        href: '/#services',
      },
      {
        name: 'Bookkeeping',
        description: 'Monthly close, reconciliations, and financials you can hand a lender without apologizing first.',
        href: '/#services',
      },
      {
        name: 'Advisory',
        description: 'Entity structure, cash flow planning, and quarterly estimates. The decisions that move your tax bill before year end.',
        href: '/#services',
      },
      {
        name: 'Payroll',
        description: 'Multi-state payroll, contractor filings, and the quarterly forms that generate notices when they run late.',
        href: '/#services',
      },
    ],
    schemaType: 'ProfessionalService',
  },

  nav: [
    { href: '/#services', label: 'Services' },
    { href: '/#about', label: 'About' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ],

  cta: {
    primary: { label: 'Book a Consultation', href: '/contact' },
    secondary: { label: 'Call (555) 010-0142', href: 'tel:+15550100142' },
  },
};
