/**
 * Site-wide config. The values marked PLACEHOLDER need real data before launch —
 * see the README "Placeholder values to replace" checklist.
 */
export const SITE = {
  name: 'Hilary Tang',
  quote: '"the world is very, very beautiful if you look at it."',
  // PLACEHOLDER — replace with the real address once the domain resolves.
  email: 'hilary@example.com',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/untangled.hills/' },
  ],
  copyrightYear: 2026,
} as const;
