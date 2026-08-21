import Image from 'next/image';
import type { Partner } from '@/data/partners';
import OfferRow from './OfferRow';

/**
 * One company (PRD §4.2): the title is an umbrella spanning the full width,
 * with the brand on the left and its offers on the right beneath it. Partners
 * are separated by a hairline rule and generous space — no alternating
 * background colours, no cards.
 */
export default function PartnerSection({
  partner,
  isFirst,
}: {
  partner: Partner;
  isFirst: boolean;
}) {
  const { logo, offers } = partner;
  // SVGs don't benefit from the image optimizer, and routing one through it
  // requires `dangerouslyAllowSVG` in next.config. Serve vectors as-is.
  const isVector = logo.src.toLowerCase().endsWith('.svg');
  // A single offer isn't a sequence, so it gets no number (PRD §4.2).
  const numbered = offers.length > 1;

  return (
    <section
      id={partner.slug}
      aria-labelledby={`${partner.slug}-title`}
      className={`scroll-mt-8 md:scroll-mt-12 ${isFirst ? '' : 'mt-24 border-t border-rule pt-24'}`}
    >
      {/* The umbrella title. It carries the hero's quote treatment — the page
          has no h1 of its own, so this is the first real statement on it and
          needs that weight. #4A4A4A is a one-off literal from Hero.tsx, not a
          token. */}
      <h2
        id={`${partner.slug}-title`}
        className="max-w-quote font-light"
        style={{ fontSize: '20px', lineHeight: 1.6, color: '#4A4A4A' }}
      >
        {partner.title}
      </h2>

      {/* 220px, not the 96px a bare logo needs: the column now carries the whole
          brand block — mark, name, and the sentence explaining the company — so
          it has to hold a readable paragraph, not just an icon. */}
      <div className="mt-5 grid md:mt-6 md:grid-cols-[220px_1fr] md:gap-8">
        {/* Brand block. A row on mobile (logo beside the name, so the offers
            stay near the top of the screen), a stack on desktop that parks in
            the left column while a long offer list scrolls past it.

            The logo is capped by height, not column width: a square icon mark
            blown up to the full 220px column dwarfs the offers beside it, while
            a wide wordmark should still get the full column. Constraining both
            axes lets the browser fit either shape from its own intrinsics. */}
        <div className="md:sticky md:top-12 md:self-start">
          {/* Mark and name: a row on mobile so the offers stay near the top of
              the screen, a stack on desktop. */}
          <div className="flex items-center gap-3 md:block">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              unoptimized={isVector}
              className="h-9 w-auto max-w-[112px] object-contain object-left md:h-auto md:max-h-16 md:max-w-full"
            />
            {/* Name the company in text, not just in the mark — the logo alone
                leaves it unreadable to anyone who doesn't recognise it. */}
            <p
              className="text-ink md:mt-4"
              style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
            >
              {partner.name}
            </p>
          </div>

          {/* 13px, not the 15px this used before: in a 220px column, 15px would
              set at roughly 24 characters a line. Dropping a step buys back
              enough characters to stop it reading as a ribbon. */}
          {partner.description && (
            <p
              className="mt-4 text-ink-secondary"
              style={{ fontSize: '13px', lineHeight: 1.7 }}
            >
              {partner.description}
            </p>
          )}
        </div>

        {/* Capped to a reading measure. Left to fill the 1fr column, the rule
            between offers ran most of a 1600px page and read as a page divider
            rather than as the seam between two related items. */}
        <ul className="mt-10 max-w-2xl md:mt-0">
          {offers.map((offer, i) => (
            <li key={offer.id} className={i === 0 ? '' : 'mt-8'}>
              {/* The rule starts where the headline starts, not at the number's
                  gutter: ml-10 clears the w-6 gutter plus its gap-4. Running it
                  under the numbers made the index look like a table column. */}
              {i > 0 && <div aria-hidden className="mb-8 ml-10 border-t border-rule" />}
              <OfferRow offer={offer} index={numbered ? i : null} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
