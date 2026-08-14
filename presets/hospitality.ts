import type { Preset } from './types';

/**
 * Hospitality preset — The Copper Kettle, a neighborhood restaurant.
 * Leads with the room (hero image + gallery) and treats the services grid
 * as the menu.
 */
export const hospitalityPreset: Preset = {
  key: 'hospitality',
  label: 'Restaurant & hospitality',
  description: 'Restaurants, cafes, bars, and venues — places people come to rather than call.',

  sections: [
    'hero',
    'gallery',
    'about',
    'servicesGrid',
    'testimonials',
    'hoursMap',
    'faq',
    'ctaBand',
    'contactBand',
  ],

  copy: {
    hero: {
      eyebrow: 'Bridge District · Dinner Tuesday through Sunday',
      heading: 'A neighborhood table',
      headingAccent: 'worth the walk.',
      sub: 'Wood-fired plates, a short list of natural wine, and a room loud enough to be fun and quiet enough to talk in. Eight bar seats are held for walk-ins every night.',
      primaryCta: { label: 'Book a Table', href: '/contact' },
      secondaryCta: { label: 'Call (555) 010-0177', href: 'tel:+15550100177' },
      note: 'Kitchen open until 10pm. 11pm Friday and Saturday.',
      image: {
        src: '/gallery/placeholder-1.svg',
        alt: 'The dining room at The Copper Kettle, set before evening service',
      },
    },
    gallery: {
      eyebrow: 'The room',
      heading: 'A look around before you come in',
      images: [
        { src: '/gallery/placeholder-1.svg', alt: 'The open kitchen and copper hood at the back of the dining room' },
        { src: '/gallery/placeholder-2.svg', alt: 'Wood-fired lamb shoulder, plated for two' },
        { src: '/gallery/placeholder-3.svg', alt: 'The bar at the front of the house during service' },
        { src: '/gallery/placeholder-4.svg', alt: 'Focaccia and cultured butter from the morning bake' },
        { src: '/gallery/placeholder-5.svg', alt: 'The back patio strung with lights on a summer evening' },
        { src: '/gallery/placeholder-6.svg', alt: 'The private room set for a party of sixteen' },
      ],
    },
    about: {
      eyebrow: 'Our story',
      heading: 'One room, one fire,',
      headingAccent: 'and whatever came in that morning.',
      paragraphs: [
        'The Copper Kettle opened in a former hardware store in 2017 with sixteen seats and a wood oven that took three tries to get right. We have since taken over the space next door, but the oven has not moved and neither has the idea behind it: cook what is good this week, cook it over fire, and keep prices where neighbors can come twice a month.',
        'The menu shifts as the market does. A few dishes change most weeks and the whole thing turns over with the season. If you loved something and it has gone, ask us. There is a decent chance it comes back in the fall.',
      ],
      bullets: {
        label: 'Good to know',
        items: [
          'Menu changes weekly',
          'Bar seats held for walk-ins',
          'Vegetarian and gluten-free options nightly',
          'Private room seats sixteen',
        ],
      },
    },
    servicesGrid: {
      eyebrow: 'Dinner service',
      heading: 'On the menu',
      headingAccent: 'this week.',
      sub: 'Five courses to move through at your own pace. Plates come out as they are ready, so order a few things and share them.',
    },
    testimonials: {
      eyebrow: 'From the neighborhood',
      heading: 'What guests tell us',
      headingAccent: 'on the way out.',
      items: [
        {
          quote: 'We walked in on a Tuesday with no reservation, sat at the bar, and ended up talking to the cooks for two hours. It is our anniversary spot now.',
          name: 'Nadia',
          role: 'Regular since 2019',
        },
        {
          quote: 'Best lamb I have had outside my grandmother\'s kitchen, and she would have said the same thing.',
          name: 'Dev',
          role: 'Bridge District',
        },
        {
          quote: 'I have a gluten allergy, so I usually eat before I go out. Here I ate my way through the whole menu. Nobody made it a production.',
          name: 'Colleen',
          role: 'First visit, back the next week',
        },
      ],
    },
    hoursMap: {
      eyebrow: 'Hours & location',
      heading: 'Look for the copper door',
    },
    faq: {
      eyebrow: 'Before you come in',
      heading: 'Questions from',
      headingAccent: 'the reservation line.',
      items: [
        {
          q: 'Do you take reservations?',
          a: 'Yes, up to thirty days out for parties of two to six. The eight bar seats are kept for walk-ins every night, so there is almost always a way in.',
        },
        {
          q: 'Can you work around dietary restrictions?',
          a: 'Tell us when you book and again when you sit down. Every section of the menu has vegetarian and gluten-free options, and the kitchen handles allergies every night of the week.',
        },
        {
          q: 'Is it a good room for kids?',
          a: 'At the early seatings, absolutely. We have high chairs and the pasta course makes most kids happy. After 8pm it gets loud and the pacing slows down.',
        },
        {
          q: 'Do you host private events?',
          a: 'The back room seats sixteen and books as a set menu. Send us your date and headcount and we will come back with options and pricing.',
        },
        {
          q: 'Where should we park?',
          a: 'Street parking on Mill and Fourth is free after 6pm, and the garage on Third is a three-minute walk. Most of the neighborhood walks or bikes over.',
        },
      ],
    },
    ctaBand: {
      heading: 'The tables are set',
      headingAccent: 'most nights by five.',
      sub: 'Book online, or call the restaurant after 3pm and a person will pick up.',
      cta: { label: 'Book a Table', href: '/contact' },
    },
    contactBand: {
      eyebrow: 'Get in touch',
      heading: 'Big parties, press,',
      headingAccent: 'and everything else.',
      sub: 'Buyouts, a group of twelve, a question the menu did not answer. Send a note and we will get back to you within a day.',
      formSource: 'contact',
    },
  },

  sampleBusiness: {
    services: [
      {
        name: 'Snacks & bread',
        description: 'House focaccia and cultured butter, marinated olives, and whatever the fryer is doing tonight.',
        price: '$6–14',
      },
      {
        name: 'From the garden',
        description: 'Market vegetables, charred or raw, dressed with what is in season. Two of the four are usually vegan.',
        price: '$12–18',
      },
      {
        name: 'Pasta',
        description: 'Rolled and cut the same day. Three shapes most nights: one rich, one green, one built around the fish that came in.',
        price: '$19–26',
      },
      {
        name: 'From the fire',
        description: 'Whole fish, lamb shoulder, and a dry-aged steak meant for the table, all cooked over oak.',
        price: '$28–62',
      },
      {
        name: 'Sweets',
        description: 'Olive oil cake, seasonal sorbet, and an affogato that is mostly an excuse to keep sitting there.',
        price: '$9–12',
      },
      {
        name: 'Wine & bar',
        description: 'Thirty bottles, mostly low-intervention and mostly under $70, plus four cocktails that never change.',
        price: 'By the glass from $11',
      },
    ],
    schemaType: 'LocalBusiness',
  },

  nav: [
    { href: '/#services', label: 'Menu' },
    { href: '/#about', label: 'About' },
    { href: '/#gallery', label: 'Photos' },
    { href: '/#hours', label: 'Hours' },
    { href: '/contact', label: 'Contact' },
  ],

  cta: {
    primary: { label: 'Book a Table', href: '/contact' },
    secondary: { label: 'Call (555) 010-0177', href: 'tel:+15550100177' },
  },
};
