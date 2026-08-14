// sitekit:config v1 — generated structure; safe to hand-edit. npm run setup will warn before overwriting.
import type { SiteConfig } from '@/lib/config/types';
import { validateSiteConfig } from '@/lib/config/validate';

/**
 * Halion Lab — a workshop for useful software and practical AI, building in
 * public. Dark monochrome brand; the homepage mirrors the Halion Lab design:
 * hero → projects (servicesGrid) → build log (blogTeaser) → philosophy
 * (processSteps) → community CTA (ctaBand).
 *
 * PLACEHOLDER contact details below (phone, address) — replace before launch.
 */
export const site: SiteConfig = {
  name: 'Halion Lab',
  tagline: 'Ideas become products here.',
  description:
    'Halion Lab is a workshop for exploring AI, testing software ideas, and building tools that remove friction from real work — shipped in public.',
  url: 'https://halionlab.com',

  logo: { src: '/halion-mark.svg', alt: 'Halion Lab', width: 28, height: 28 },

  business: {
    legalName: 'Halion Lab',
    // Placeholder phone — the validator requires one; swap in a real number.
    phone: '+1-555-010-0100',
    email: 'hello@halionlab.com',
    // Placeholder address — feeds JSON-LD and the legal pages.
    address: {
      street: '100 Placeholder Ave',
      city: 'Albuquerque',
      region: 'NM',
      postalCode: '87101',
      country: 'US',
    },
    hours: {
      mon: '9:00-17:00',
      tue: '9:00-17:00',
      wed: '9:00-17:00',
      thu: '9:00-17:00',
      fri: '9:00-17:00',
      sat: 'closed',
      sun: 'closed',
    },
    serviceAreas: [],
    // The lab's projects — rendered as the "What we're building" grid.
    // `price` doubles as the status badge (Building / Live).
    services: [
      {
        name: 'Mosaic',
        description:
          'AI that sounds like you. A voice signature engine that helps AI write the way you do.',
        href: '/blog',
        price: 'Building',
      },
      {
        name: 'QuietOS',
        description:
          'Digital employees that quietly handle work. Rooms that run workflows and return finished work for approval.',
        href: '/blog',
        price: 'Building',
      },
      {
        name: 'Small Business Trend',
        description:
          "Research and education for AI adoption. Practical AI insights for owners who don't have time for hype.",
        href: '/blog',
        price: 'Live',
      },
    ],
    schemaType: 'Organization',
  },

  nav: [
    { href: '/#projects', label: 'Projects' },
    { href: '/blog', label: 'Build Log' },
    { href: '/contact', label: 'Contact' },
  ],
  footerLinks: [
    { href: '/blog', label: 'Build Log' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ],
  social: {},

  cta: {
    primary: { label: 'Explore Projects', href: '/#projects' },
    secondary: { label: 'Follow the Build Log', href: '/blog' },
  },

  sections: [
    'custom:halionHero',
    'custom:halionProjects',
    'custom:halionBuildLog',
    'processSteps',
    'custom:halionCommunity',
  ],

  copy: {
    processSteps: {
      eyebrow: 'The philosophy',
      heading: 'Build simple. Stay useful.',
      steps: [
        {
          title: 'Useful over impressive.',
          description: 'Technology should remove burden, not create it.',
        },
        {
          title: 'Systems over hacks.',
          description: 'Durable processes beat clever demos.',
        },
        {
          title: 'Augment, not automate.',
          description:
            'Automation runs quietly in the background so people work with more leverage — not less control.',
        },
      ],
    },
    custom: {
      halionHero: {
        eyebrow: 'Building useful software in public',
        heading: 'Ideas become products here.',
        sub: 'Halion Lab is our workshop for exploring AI, testing software ideas, and building tools that remove friction from real work.',
        image: { src: '/halion-mark.svg', alt: 'Halion Lab mark' },
        primaryCta: { label: 'Explore Projects', href: '/#projects' },
        secondaryCta: { label: 'Follow the Build Log', href: '/#buildlog' },
      },
      halionProjects: {
        eyebrow: "What we're building",
        heading: 'Each project is a living experiment.',
        sub: "Not features on a roadmap — working software we're shaping in the open, one decision at a time.",
        projects: [
          {
            name: 'Mosaic',
            tagline: 'AI that sounds like you.',
            description: 'A voice signature engine that helps AI write the way you do.',
            status: 'Building',
            live: false,
            updated: 'Updated Jun 2026',
            href: '/blog/mosaic-voice-profile-engine-expanded',
            previewLabel: 'voice signature preview',
          },
          {
            name: 'QuietOS',
            tagline: 'Digital employees that quietly handle work.',
            description: 'Rooms that run workflows and return finished work for approval.',
            status: 'Building',
            live: false,
            updated: 'Updated Jun 2026',
            href: '/blog/quietos-owner-inbox-redesigned',
            previewLabel: 'owner inbox preview',
          },
          {
            name: 'Small Business Trend',
            tagline: 'Research and education for AI adoption.',
            description: "Practical AI insights for owners who don't have time for hype.",
            status: 'Live',
            live: true,
            updated: 'Updated Jun 2026',
            href: '/blog/halion-lab-launched',
            previewLabel: 'research preview',
          },
        ],
      },
      halionBuildLog: {
        eyebrow: 'Build log',
        heading: 'Shipping in public.',
        sub: 'Every experiment, lesson, and product decision documented as we build.',
        cta: { label: 'Read the full log', href: '/blog' },
        entries: [
          {
            date: 'Jun 2026',
            tag: 'Screens',
            title: 'QuietOS Owner Inbox redesigned',
            href: '/blog/quietos-owner-inbox-redesigned',
            highlight: true,
          },
          {
            date: 'Jun 2026',
            tag: 'Notes',
            title: 'Mosaic voice profile engine expanded',
            href: '/blog/mosaic-voice-profile-engine-expanded',
          },
          {
            date: 'Jun 2026',
            tag: 'Video',
            title: 'First SMS workflows tested',
            href: '/blog/first-sms-workflows-tested',
          },
          {
            date: 'Jun 2026',
            tag: 'Article',
            title: 'Halion Lab launched',
            href: '/blog/halion-lab-launched',
          },
        ],
      },
      halionCommunity: {
        eyebrow: 'Come build with us',
        heading: 'Come build with us.',
        sub: 'Follow the projects, read the notes, and watch ideas turn into products.',
        ctas: [
          { label: 'Join Newsletter', href: '/contact', primary: true },
          { label: 'View Build Log', href: '/#buildlog' },
          { label: 'See All Projects', href: '/#projects' },
        ],
        // Placeholder media wall from the design mockup — swap tiles for real
        // screenshots/videos as build-log media accumulates.
        tiles: [
          { kind: 'media', label: 'screenshot', height: 220 },
          { kind: 'video', label: 'video', height: 150 },
          { kind: 'media', label: 'sketch', height: 180 },
          { kind: 'note', lines: ['commit a1f4c2', 'feat: inbox triage', '+128 −42'], height: 130 },
          { kind: 'media', label: 'product shot', height: 170 },
          { kind: 'video', label: 'video', height: 200 },
          { kind: 'media', label: 'screenshot', height: 160 },
          { kind: 'media', label: 'sketch', height: 210 },
        ],
      },
    },
  },

  features: {
    blog: true,
    cms: false,
    gatedDownload: false,
    analytics: false,
  },
  analytics: {
    provider: 'none',
  },
};

validateSiteConfig(site);
export default site;
