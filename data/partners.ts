/**
 * Affiliate partners — the /partnerships page (PRD §3).
 *
 * Typed TS rather than JSON: `photos.json` is JSON because a script writes it.
 * This one is hand-edited, so the compiler catches a missing `cta` or a typo'd
 * key at build time instead of at runtime.
 *
 * Adding a company = one entry here + a logo in `public/partners/`. No
 * component changes (PRD §6.2).
 *
 * This repo is public: reader-facing offers only. No commission rates, no
 * contract terms (PRD §7).
 */

export type Offer = {
  id: string;
  /** "30% off Mokomoko Pro — annual subscription" */
  headline: string;
  price?: {
    /** "$1 USD" */
    current: string;
    /** "$25 USD" — renders struck through, with a spoken "was" before it. */
    original?: string;
  };
  /** 1–2 sentences: who this is for. */
  goal: string;
  /** Promo code, if there is one. Renders as a click-to-copy chip. */
  code?: string;
  cta: { label: string; href: string };
};

export type Partner = {
  /** "mokomoko" — also the #anchor. */
  slug: string;
  /** The reader's goal, not the company's pitch — "Buying a house in Japan as
   *  a foreigner", never "Japan's leading akiya marketplace". */
  title: string;
  name: string;
  /** One sentence on what the company does, for readers who've never heard of
   *  it. Optional: a partner people already know doesn't need one. */
  description?: string;
  logo: { src: string; alt: string; width: number; height: number };
  order: number;
  offers: Offer[];
};

/**
 * Required disclosure. Japan's 2023 stealth-marketing rules (景品表示法) make an
 * unlabelled affiliate link an unfair representation. Kept here so wording is a
 * one-line edit, not a component change.
 *
 * Rendered above the offers, not at the foot: both the JFTC and the FTC ask for
 * disclosure that is "clear and conspicuous", which means a reader meets it
 * before the link rather than after. Every CTA also carries rel="sponsored",
 * covering the machine-readable half.
 *
 * Keep it short enough to set on one line — see the note in the page component.
 */
export const AFFILIATE_DISCLOSURE =
  'Some links below are affiliate links, meaning I may earn a commission at no extra cost to you.';

export const PARTNERS: Partner[] = [
  {
    slug: 'mokomoko',
    title: 'Buying a house in Japan as a foreigner',
    name: 'Mokomoko',
    description:
      'Mokomoko helps foreigners buy property in Japan with English listings, property risk data, and local agent support.',
    // Square icon mark. Give the file's true intrinsic size — the layout caps
    // display height and lets width follow, so square marks and wide wordmarks
    // both land at a sensible size without per-partner tuning.
    logo: { src: '/partners/mokomoko.jpeg', alt: 'Mokomoko', width: 200, height: 200 },
    order: 1,
    // Every CTA carries `?via=untangledhills`, including the one whose discount
    // comes from a promo code — a bare URL sets no referral cookie (PRD §3.1).
    // Deep links keep the param too: it goes on the URL, not just the root.
    offers: [
      {
        id: 'mokomoko-pro-annual',
        headline: '30% Off Mokomoko Pro Annual Plan',
        // Reads as a sentence, not a spec-sheet field: the "Goal:" label is
        // gone from the UI, so the copy has to stand on its own.
        goal: 'Find and compare akiya that fit what you’re looking for.',
        cta: {
          label: 'Claim 30% off',
          href: 'https://www.mokomoko.com/?via=untangledhills',
        },
      },
      {
        id: 'mokomoko-consult',
        headline: '$1 Mokomoko Property Consultation',
        price: { current: '$1 USD', original: '$25 USD' },
        code: 'HILARY',
        goal: 'Explore how Mokomoko can help you actually buy a property in Japan.',
        cta: {
          label: 'Book a consultation',
          href: 'https://www.mokomoko.com/buy?via=untangledhills',
        },
      },
    ],
  },
];
