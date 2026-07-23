import { SITE } from '@/data/site';
import { getPhotoStats } from '@/lib/photos';

/**
 * Deliberately small — the grid is the page (PRD §4.2). No background image,
 * no full-bleed, no scroll indicator.
 */

export default function Hero() {
  const { countries, minYear, maxYear } = getPhotoStats();
  return (
    <header className="pb-12 pt-16 text-center md:pb-20 md:pt-28">
      <h1
        className="text-ink"
        style={{
          fontSize: '15px',
          lineHeight: 1.2,
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
        }}
      >
        {SITE.name}
      </h1>
      {/* The quote is the focal point — light italic, balanced over two lines.
          Fixed min-height reserves the two lines so a font swap can't reflow
          it (keeps CLS ~0). */}
      {/* A full modular step above the 15px name (~1.33) so the quote clearly
          leads — at 17px the tracked caps name read as the same rank. Two
          reserved lines: 2 × 20px × 1.6 = 64px. */}
      <p
        className="mx-auto mt-7 min-h-[4rem] font-light"
        style={{ fontSize: '20px', lineHeight: 1.6, color: '#4A4A4A' }}
      >
        {SITE.quoteLines.map((line, i) => (
          <span key={line} className="block">
            {i === 0 && '“'}
            {line}
            {i === SITE.quoteLines.length - 1 && '”'}
          </span>
        ))}
      </p>

      {/* Hairline anchor between the poetic block and the quiet meta. */}
      <div aria-hidden className="mx-auto mt-8 h-px w-6 bg-rule" />

      <div className="mt-6 flex flex-col items-center gap-2 text-ink-tertiary">
        <p
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
        >
          {countries} countries · {minYear}–{maxYear}
        </p>
        {/* Handles and emails are lowercase identifiers — keep them as written. */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          style={{ fontSize: '12px', letterSpacing: '0.05em' }}
        >
          {SITE.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              {s.handle ?? s.label}
            </a>
          ))}
          <span aria-hidden>·</span>
          <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-ink">
            {SITE.email}
          </a>
        </div>
      </div>
    </header>
  );
}
