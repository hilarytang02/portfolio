import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import PartnerSection from '@/components/PartnerSection';
import { AFFILIATE_DISCLOSURE } from '@/data/partners';
import { getPartners } from '@/lib/partners';

/**
 * Route-level metadata (PRD §5) — layout.tsx hardcodes "Hilary Tang —
 * Photography", which is wrong for this page.
 */
export const metadata: Metadata = {
  title: 'Partnerships — Hilary Tang',
  description: 'Companies I work with, and the offers I can get you.',
  openGraph: {
    title: 'Partnerships — Hilary Tang',
    description: 'Companies I work with, and the offers I can get you.',
    type: 'website',
  },
};

export default function PartnershipsPage() {
  const partners = getPartners();

  // This page sets its own measure rather than inheriting max-w-page (1600px,
  // which exists for the photo grid). 55rem − px-10 leaves exactly the 800px the
  // offer grid wants (96 logo + 32 gap + 672 offers).
  //
  // Why it matters: with a 1600px container, the centred masthead sat on the
  // page's centreline while the content block's left edge fell ~400px in,
  // aligned to nothing — two unrelated axes. Narrowing the page collapses them
  // into one column, so the header centres inside the same column the offers
  // start at and the left edge finally means something.
  return (
    <div className="mx-auto max-w-[55rem] px-6 md:px-10">
      <Hero variant="compact" />

      {/* Rhythm across the whole page (deliberate, three steps):
            nav → disclosure   ~40px  small
            disclosure → title ~64px  medium
            title → offers     ~24px  tight
          The gaps used to be 88 / 80 / 32, which read as two blank bands with
          content stranded between them. */}
      <main>
        {/* The page shows no heading of its own — each partner's umbrella title
            leads instead. This keeps the document outline valid and gives
            screen-reader users the page's name without adding visible copy. */}
        <h1 className="sr-only">Partnerships</h1>

        {/* Affiliate disclosure, above the offers so a reader meets it before
            the first link (see data/partners.ts). No max-width, so it sets on
            one line rather than wrapping inside a measure.

            ink-secondary, not ink-tertiary: tertiary is 2.50:1 against the page
            background, which fails WCAG AA and undercuts the "clear and
            conspicuous" standard this line exists to satisfy. Secondary is
            5.10:1 — still quiet, still subordinate, but actually legible. */}
        {/* Deliberately two lines, not one. At 93 characters this sets to ~577px
            on a single line — well past a comfortable measure, and a wide flat
            bar under three short centred lines reads as top-heavy. 52ch forces
            the break; `text-balance` evens the two lines rather than leaving a
            long first line and a stub. Same idiom as the gallery's hero quote,
            which is likewise balanced over two lines. */}
        <p
          className="mx-auto max-w-[52ch] text-balance text-center text-ink-secondary"
          style={{ fontSize: '12px', letterSpacing: '0.05em', lineHeight: 1.7 }}
        >
          {AFFILIATE_DISCLOSURE}
        </p>

        {/* No width or centring of its own any more — it fills the page column,
            which is now the right width. The type inside stays left-aligned;
            centring prose would give every line a ragged left edge and break the
            eye's return sweep. */}
        <div className="mt-14 pb-24 md:mt-16 md:pb-32">
          {partners.length === 0 ? (
            // Only reachable if PARTNERS is emptied. Cheap guard against a page
            // that renders a disclosure and then nothing at all.
            <p className="text-center text-ink-secondary" style={{ fontSize: '13px' }}>
              No partnerships to show right now.
            </p>
          ) : (
            partners.map((partner, i) => (
              <PartnerSection key={partner.slug} partner={partner} isFirst={i === 0} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
