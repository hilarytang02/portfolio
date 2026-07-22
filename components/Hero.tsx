import { SITE } from '@/data/site';
import { getPhotoStats } from '@/lib/photos';

/**
 * Deliberately small — the grid is the page (PRD §4.2). No background image,
 * no full-bleed, no scroll indicator.
 */
export default function Hero() {
  const { cities, minYear, maxYear } = getPhotoStats();
  return (
    <header className="pb-10 pt-14 text-center md:pb-16 md:pt-24">
      <h1
        className="text-ink"
        style={{
          fontSize: '13px',
          lineHeight: 1.2,
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
        }}
      >
        {SITE.name}
      </h1>
      {/* Fixed min-height reserves two lines so a font swap can't reflow the
          quote and shift the grid/footer below it (keeps CLS ~0, PRD §8). */}
      <p
        className="mx-auto mt-6 flex min-h-[3rem] max-w-quote items-start justify-center font-light text-ink-secondary"
        style={{ fontSize: '15px', lineHeight: 1.5 }}
      >
        {SITE.quote}
      </p>
      <div
        className="mt-5 flex flex-col items-center gap-1.5"
        style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em' }}
      >
        <p className="text-ink-tertiary">
          {cities} cities · {minYear}–{maxYear}
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
