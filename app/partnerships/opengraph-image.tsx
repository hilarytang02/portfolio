import { ImageResponse } from 'next/og';
import { SITE } from '@/data/site';

/**
 * Social card for /partnerships. Essentially all traffic to this page arrives
 * from a link posted on Instagram, where a page with no OG image renders as a
 * bare grey box — so this is the first impression for most visitors.
 *
 * Built with `next/og`, which ships inside Next.js: no new dependency (PRD §6.6),
 * and the image is generated once at build time rather than per request.
 *
 * satori (what powers ImageResponse) needs an explicit `display: flex` on any
 * element with more than one child, and supports no CSS shorthand beyond the
 * basics — hence the verbose style objects.
 */

export const alt = 'Partnerships — Hilary Tang';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF8',
          color: '#1A1A1A',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            letterSpacing: 12,
            textTransform: 'uppercase',
          }}
        >
          {SITE.name}
        </div>

        <div style={{ display: 'flex', marginTop: 28, fontSize: 24, color: '#6B6B6B' }}>
          {SITE.socials[0]?.handle ?? SITE.email}
        </div>

        {/* The same hairline the site uses to separate a statement from its meta. */}
        <div
          style={{
            display: 'flex',
            width: 48,
            height: 1,
            marginTop: 48,
            backgroundColor: '#E5E5E2',
          }}
        />

        <div style={{ display: 'flex', marginTop: 48, fontSize: 60, color: '#4A4A4A' }}>
          Partnerships
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 22,
            letterSpacing: 2,
            color: '#6B6B6B',
          }}
        >
          Companies I work with, and the offers I can get you
        </div>
      </div>
    ),
    { ...size },
  );
}
