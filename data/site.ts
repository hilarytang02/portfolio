/**
 * Site-wide config. The values marked PLACEHOLDER need real data before launch —
 * see the README "Placeholder values to replace" checklist.
 */
export const SITE = {
  name: 'Hilary Tang',
  quote: '"what a blessing it is to be alive and to see the world"',
  /** The quote split at its semantic break — line two lands like a punchline. */
  quoteLines: ['what a blessing it is to be alive', 'and to see the world'],
  email: 'untangled.hills@gmail.com',
  socials: [
    {
      label: 'Instagram',
      handle: '@untangled.hills',
      href: 'https://www.instagram.com/untangled.hills/',
    },
  ],
} as const;
