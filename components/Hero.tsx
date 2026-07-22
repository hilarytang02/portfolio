import { SITE } from '@/data/site';

/**
 * Deliberately small — the grid is the page (PRD §4.2). No background image,
 * no full-bleed, no scroll indicator.
 */
export default function Hero() {
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
    </header>
  );
}
