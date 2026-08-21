'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Gallery' },
  { href: '/partnerships', label: 'Partnerships' },
] as const;

/**
 * The whole nav (PRD §2) — a centred row in the site's wayfinding register,
 * not a logo-left/links-right bar.
 *
 * It sits inside the masthead and scrolls away with it rather than sticking:
 * `/` already has a sticky FilterBar at `top-0 z-30`, and a second persistent
 * strip above it would stack two bars over the one page that is meant to be
 * nothing but grid. Anchors on /partnerships use `scroll-mt-*` for breathing
 * room instead of nav-height clearance.
 *
 * `'use client'` buys exactly one thing: `usePathname()` for `aria-current`.
 */
export default function SiteNav({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Site"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}
      style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
    >
      {LINKS.map((link, i) => {
        const active = pathname === link.href;
        return (
          <Fragment key={link.href}>
            {i > 0 && (
              <span aria-hidden className="text-ink-tertiary">
                ·
              </span>
            )}
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`transition-colors hover:text-ink ${
                active ? 'text-ink' : 'text-ink-tertiary'
              }`}
            >
              {link.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
