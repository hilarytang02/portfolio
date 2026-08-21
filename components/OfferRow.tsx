import type { Offer } from '@/data/partners';
import CopyCode from './CopyCode';

/**
 * One offer (PRD §4.3). Not a card — the site has no cards, and a card inside a
 * card is the templated look this page is avoiding. Separation is a hairline
 * rule, drawn by the caller between rows.
 *
 * `index` is null when the partner has a single offer: numbering is only
 * meaningful when the sequence is a deliberate priority order.
 */
export default function OfferRow({ offer, index }: { offer: Offer; index: number | null }) {
  const { price, code, cta } = offer;

  return (
    <div className="flex gap-4">
      {/* Quiet index in its own gutter rather than inline before the headline —
          keeps it as metadata and keeps every headline on one left edge. */}
      {index !== null && (
        <span
          aria-hidden
          className="w-6 shrink-0 pt-1 text-ink-tertiary tabular-nums"
          style={{ fontSize: '10px', letterSpacing: '0.08em' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {/* 16px against 13px body: enough separation to lead the row without
            reaching for a bolder weight, which this site never uses. */}
        <h3 className="text-ink" style={{ fontSize: '16px', lineHeight: 1.5, fontWeight: 400 }}>
          {offer.headline}
        </h3>

        {price && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3" style={{ fontSize: '13px' }}>
            <span className="text-ink tabular-nums">{price.current}</span>
            {price.original && (
              <>
                <span aria-hidden className="text-ink-tertiary">
                  ·
                </span>
                <span className="text-ink-tertiary tabular-nums">
                  {/* Spoken separator so "$1 USD $25 USD" can't run together
                      into one amount (PRD §6.5). */}
                  <span className="sr-only">, was </span>
                  <s>{price.original}</s>
                </span>
              </>
            )}
          </p>
        )}

        {/* Own line. Sharing a row with the price crowded two unrelated facts
            — what it costs, and what to type at checkout. */}
        {code && (
          <div className="mt-3">
            <CopyCode code={code} />
          </div>
        )}

        {/* 72ch, not the usual ~52: these are single sentences rather than
            paragraphs, so the measure can run wider to keep each on one line.
            The longest goal sets to ~460px including the label, comfortably
            inside the 632px the offer column gives it. */}
        <p
          className="mt-4 max-w-[72ch] text-ink-secondary"
          style={{ fontSize: '13px', lineHeight: 1.7 }}
        >
          {/* Kept as a label, but dropped into the site's small-label register
              — same size, tracking and colour as "Promo code" — so it orients
              without competing with the sentence it introduces. */}
          <span
            className="text-ink-tertiary"
            style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Goal:{' '}
          </span>
          {offer.goal}
        </p>

        {/* The site has zero filled buttons — this is a text link with a rule
            under it. Full-width tap target on mobile; on desktop a shared
            minimum width so both CTAs read as equivalent actions and their
            arrows line up. rel="sponsored" is the correct signal for a paid
            link. */}
        {/* Vertical padding on mobile only: at 11px with just `pb-2` the tap
            target computes to roughly 21px tall, well under the 44px platform
            guidance for what is the primary action on a phone-first page.
            Desktop keeps the tight underline, where a cursor doesn't care.

            No shared minimum width on desktop: forcing "Claim 30% off" to the
            length of "Book a consultation" left the shorter rule running past
            its own text, which read as arbitrary. Each underline now measures
            its own label. */}
        <a
          href={cta.href}
          target="_blank"
          rel="sponsored noopener"
          className="mt-4 flex w-full items-center justify-between gap-6 border-b border-rule pb-4 pt-4 text-ink transition-colors hover:border-ink md:mt-6 md:inline-flex md:w-auto md:gap-3 md:pb-2 md:pt-0"
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
        >
          {cta.label}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
