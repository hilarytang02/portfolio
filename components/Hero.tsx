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
          fontSize: '12px',
          lineHeight: 1.2,
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: '0.32em',
        }}
      >
        {SITE.name}
      </h1>
      {/* The quote is the focal point — larger, airier. Fixed min-height
          reserves two lines so a font swap can't reflow it (keeps CLS ~0). */}
      <p
        className="mx-auto mt-7 flex min-h-[3.6rem] max-w-[42ch] items-start justify-center font-light text-ink-secondary"
        style={{ fontSize: '17px', lineHeight: 1.65 }}
      >
        {SITE.quote}
      </p>
      <div
        className="mt-9 flex flex-col items-center gap-2"
        style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
      >
        <p className="text-ink-tertiary">
          {countries} countries · {minYear}–{maxYear}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {SITE.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-secondary transition-colors hover:text-ink"
            >
              {s.handle ?? s.label}
            </a>
          ))}
          <span aria-hidden className="text-ink-tertiary">
            ·
          </span>
          <a
            href={`mailto:${SITE.email}`}
            className="text-ink-secondary transition-colors hover:text-ink"
          >
            {SITE.email}
          </a>
        </div>
      </div>
    </header>
  );
}
