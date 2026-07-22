import { SITE } from '@/data/site';

/** Contact lives here — no page, no form (PRD §7). Text labels, not icons. */
export default function Footer() {
  return (
    <footer className="mx-auto max-w-page px-6 md:px-10">
      <div className="border-t border-rule py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <a
            href={`mailto:${SITE.email}`}
            className="text-ink transition-colors hover:text-ink-secondary"
            style={{ fontSize: '13px' }}
          >
            {SITE.email}
          </a>
          <nav
            className="flex items-center gap-6"
            aria-label="Social links"
          >
            {SITE.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink transition-colors hover:text-ink-secondary"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
        <p
          className="mt-6 text-ink-secondary"
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          © {SITE.copyrightYear} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
