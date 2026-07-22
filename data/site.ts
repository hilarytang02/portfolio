/**
 * Site-wide config. The values marked PLACEHOLDER need real data before launch —
 * see the README "Placeholder values to replace" checklist.
 */
export const SITE = {
  name: 'Hilary Tang',
  quote: '"the world is very, very beautiful if you look at it."',
  /** The quote split at its semantic break — line two lands like a punchline. */
  quoteLines: ['the world is very, very beautiful', 'if you look at it.'],
  email: 'hello@hilarytang.com',
  socials: [
    {
      label: 'Instagram',
      handle: '@untangled.hills',
      href: 'https://www.instagram.com/untangled.hills/',
    },
  ],
} as const;
