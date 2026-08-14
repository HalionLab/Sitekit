import type { Preset } from './types';

/**
 * Portfolio preset — Mara Quinn Photography, a one-person studio.
 * Work first, then price. Sold on taste and on a clear deliverable.
 */
export const portfolioPreset: Preset = {
  key: 'portfolio',
  label: 'Portfolio / creative studio',
  description: 'Photographers, designers, makers, and studios that sell the work itself.',

  sections: [
    'hero',
    'gallery',
    'about',
    'servicesGrid',
    'pricing',
    'testimonials',
    'faq',
    'contactBand',
  ],

  copy: {
    hero: {
      eyebrow: 'Asheville, NC · Weddings & portraits',
      heading: 'Pictures you will actually',
      headingAccent: 'print and hang.',
      sub: 'Documentary wedding and portrait photography out of western North Carolina. No stiff posing and no three-hour shot list, just a long day photographed the way it actually happened.',
      primaryCta: { label: 'Check Your Date', href: '/contact' },
      secondaryCta: { label: 'See the Work', href: '/#gallery' },
      note: 'Twelve weddings a year. Dates go early.',
      highlights: {
        title: 'How I work',
        items: [
          'One photographer, the whole day',
          'Every edited frame delivered',
          'Four-week turnaround, usually sooner',
          'Travel included within 100 miles',
        ],
      },
    },
    gallery: {
      eyebrow: 'Selected work',
      heading: 'Recent frames',
      images: [
        { src: '/gallery/placeholder-1.svg', alt: 'A couple leaving the ceremony through a crowd of guests' },
        { src: '/gallery/placeholder-2.svg', alt: 'A bride and her mother getting ready in morning light' },
        { src: '/gallery/placeholder-3.svg', alt: 'First dance in a barn lit by string lights' },
        { src: '/gallery/placeholder-4.svg', alt: 'Portrait session in fog on the Blue Ridge Parkway' },
        { src: '/gallery/placeholder-5.svg', alt: 'A toast at a long farm table at golden hour' },
        { src: '/gallery/placeholder-6.svg', alt: 'A newborn asleep on a parent\'s chest at home' },
      ],
    },
    about: {
      eyebrow: 'About Mara',
      heading: 'I photograph the day,',
      headingAccent: 'not the checklist.',
      paragraphs: [
        'I started shooting weddings in 2014 because I liked the mess of them. The aunt crying in the hallway, the flower girl asleep under a table, the ten seconds after the vows when nobody knows what to do with their hands. Those are the frames people keep.',
        'I work alone and quietly, in whatever light the day gives me. You give me a short list of family groupings and then I mostly disappear. Twelve weddings a year is the cap, which is what lets me spend a full week editing yours instead of an afternoon.',
      ],
      bullets: {
        label: 'Always included',
        items: [
          'A planning call before the day',
          'Full-resolution edited gallery',
          'Print release, no watermarks',
          'Backups kept for five years',
        ],
      },
    },
    servicesGrid: {
      eyebrow: 'What I photograph',
      heading: 'Weddings, portraits,',
      headingAccent: 'and the years in between.',
      sub: 'Most people find me for a wedding and come back for the anniversary, the newborn, or the family session at the house they finally bought.',
    },
    pricing: {
      eyebrow: 'Investment',
      heading: 'Three ways',
      headingAccent: 'to book me.',
      sub: 'Every collection includes the full edited gallery, a print release, and a planning call. Travel beyond 100 miles is quoted at cost with no extra day rate.',
      tiers: [
        {
          name: 'Half Day',
          price: '$2,400',
          description: 'Six hours of coverage. Right for a small ceremony, a courthouse morning, or a reception you want documented start to finish.',
          features: [
            'Six hours, one photographer',
            '400+ edited images',
            'Online gallery for one year',
            'Print release included',
          ],
          cta: { label: 'Check Your Date', href: '/contact' },
        },
        {
          name: 'Full Day',
          price: '$3,900',
          description: 'The collection most couples book. Getting ready through the last dance, with a second shooter for bigger guest counts.',
          features: [
            'Ten hours, second shooter included',
            '800+ edited images',
            'Engagement session',
            'Online gallery for three years',
            'Print release included',
          ],
          featured: true,
          cta: { label: 'Check Your Date', href: '/contact' },
        },
        {
          name: 'Weekend',
          price: '$6,200',
          description: 'Welcome dinner, wedding day, and the morning after. Built for destination weekends and multi-day celebrations.',
          features: [
            'Three days of coverage',
            'Second shooter throughout',
            '1,500+ edited images',
            'A 10x10 heirloom album',
            'Travel within North Carolina included',
          ],
          cta: { label: 'Check Your Date', href: '/contact' },
        },
      ],
    },
    testimonials: {
      eyebrow: 'Kind words',
      heading: 'From people who',
      headingAccent: 'hate being photographed.',
      items: [
        {
          quote: 'My husband agreed to tolerate twenty minutes of photos. Mara got three hours out of him and he never noticed.',
          name: 'Steph',
          role: 'Married at Hawkesdene',
        },
        {
          quote: 'The gallery came back in three weeks and I cried at my desk. There are pictures in there of my grandfather laughing that nobody else got.',
          name: 'Jordan',
          role: 'Downtown Asheville wedding',
        },
        {
          quote: 'She came to the house when our son was nine days old, sat on the floor, and barely said a word. The photos look like that actual week, not a catalog.',
          name: 'Bea',
          role: 'Newborn session at home',
        },
      ],
    },
    faq: {
      eyebrow: 'Good questions',
      heading: 'Things worth asking',
      headingAccent: 'before you send the date.',
      items: [
        {
          q: 'How far ahead should we book?',
          a: 'Most couples book nine to fourteen months out, and fall Saturdays in the mountains go first. If your date is close, ask anyway. Cancellations happen.',
        },
        {
          q: 'Do you travel?',
          a: 'Often. Anything within 100 miles of Asheville is included. Past that I quote flights and lodging at cost, with no additional day rate on top.',
        },
        {
          q: 'How many photos do we get, and when?',
          a: 'Between 400 and 1,500 depending on the collection, delivered in four weeks or less. A preview set of about thirty goes out within 48 hours.',
        },
        {
          q: 'How much retouching do you do?',
          a: 'Every delivered frame is color corrected and finished. I will happily remove a distracting stray or a bruise if you ask. I do not reshape bodies.',
        },
        {
          q: 'What happens if you get sick?',
          a: 'I hold a backup shooter agreement with two photographers whose work I trust, plus insurance that covers a full refund if no replacement can be found. In eleven years it has not come up.',
        },
      ],
    },
    contactBand: {
      eyebrow: 'Say hello',
      heading: 'Tell me about',
      headingAccent: 'your day.',
      sub: 'Send the date, the location, and anything you are excited or nervous about. Every inquiry gets a personal reply, usually within two days.',
      formSource: 'contact',
    },
  },

  sampleBusiness: {
    services: [
      {
        name: 'Weddings',
        description: 'Full-day documentary coverage from getting ready through the last song, with a second shooter when the guest count calls for it.',
      },
      {
        name: 'Engagement sessions',
        description: 'Ninety minutes somewhere that means something to you. A trailhead, your kitchen, the bar where you met.',
      },
      {
        name: 'Portraits',
        description: 'Individual, couple, and family sessions on location. Good for holiday cards, better for the wall.',
      },
      {
        name: 'Newborn & family at home',
        description: 'Unposed sessions in your own space during the first few weeks, when nobody is sleeping and everything changes daily.',
      },
      {
        name: 'Brand & headshots',
        description: 'Working portraits for makers, chefs, and small teams, shot where you actually work instead of against a backdrop.',
      },
    ],
    schemaType: 'Organization',
  },

  nav: [
    { href: '/#gallery', label: 'Work' },
    { href: '/#about', label: 'About' },
    { href: '/#services', label: 'Sessions' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ],

  cta: {
    primary: { label: 'Check Your Date', href: '/contact' },
    secondary: { label: 'See the Work', href: '/#gallery' },
  },
};
