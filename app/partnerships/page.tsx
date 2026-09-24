import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import PartnerSection from '@/components/PartnerSection';
import { AFFILIATE_DISCLOSURE } from '@/data/partners';
import { getPartners } from '@/lib/partners';

/**
 * Route-level metadata (PRD §5). `title` is just the section name — layout's
 * template appends "| Hilary Tang". openGraph spells it out because a share
 * card is read on its own, with no template applied.
 */
export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Companies I work with, and the offers I can get you.',
  openGraph: {
    title: 'Partnerships | Hilary Tang',
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

      {/* Rhythm across the whole page (deliberate):
            nav → disclosure   ~40px  small
            disclosure → rule  ~20px  tight — the two are one unit
            rule → first title ~56px  medium
            title → offers     ~24px  tight
          The gaps were 88 / 80 / 32 before, which read as two blank bands with
          content stranded between them. Binding the disclosure to its rule is
          what stops it floating: the space below it now exceeds the space
          above, so it attaches downward to the offers it governs. */}
      <main>
        {/* The page shows no heading of its own — each partner's umbrella title
            leads instead. This keeps the document outline valid and gives
            screen-reader users the page's name without adding visible copy. */}
        <h1 className="sr-only">Partnerships</h1>

        {/* Affiliate disclosure. Stays above the offers, and that placement is
            load-bearing rather than stylistic: both the FTC and, since Japan's
            2023 stealth-marketing rules, the JFTC ask for disclosure that is
            "clear and conspicuous", which means the reader meets it before the
            link and not after (see data/partners.ts). A footer would put it
            after every CTA on the page. Every CTA also carries rel="sponsored",
            covering the machine-readable half.

            Left-aligned, not centred. Centred under a centred masthead it had
            no edge of its own and read as stranded page furniture between the
            nav and the first offer. Flush left it shares the column edge that
            every partner title, logo and offer already starts from, so it
            belongs to the block it governs.

            ink-secondary, not ink-tertiary: tertiary is 2.50:1 against the page
            background, which fails WCAG AA and undercuts the "clear and
            conspicuous" standard this line exists to satisfy. Secondary is
            5.10:1 — still quiet, still subordinate, but actually legible.

            52ch holds it to two lines; at 93 characters a single line sets to
            ~577px, well past a comfortable measure. */}
        <p
          className="max-w-[52ch] text-balance text-ink-secondary"
          style={{ fontSize: '12px', letterSpacing: '0.05em', lineHeight: 1.7 }}
        >
          {AFFILIATE_DISCLOSURE}
        </p>

        {/* The rule the disclosure sits on. It gives the line something to
            anchor to and doubles as the top edge of the offers block, so the
            two read as one preamble rather than as a stray sentence. Echoes the
            hairline PartnerSection already uses as a seam between partners. */}
        <div aria-hidden className="mt-5 border-t border-rule" />

        {/* No width or centring of its own any more — it fills the page column,
            which is now the right width. The type inside stays left-aligned;
            centring prose would give every line a ragged left edge and break the
            eye's return sweep. */}
        <div className="mt-12 pb-24 md:mt-14 md:pb-32">
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
