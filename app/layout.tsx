import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  // Section-first, because tabs truncate at ~15 chars and "Hilary Tang —…"
  // twice over tells you nothing about which tab is which. The label matches
  // SiteNav's, so the tab always names the link you clicked. `template` means
  // a new route only has to declare its own section name.
  //
  // The description carries "Photography by Hilary Tang" for the search snippet,
  // since neither title says it any more.
  title: {
    default: 'Gallery | Hilary Tang',
    template: '%s | Hilary Tang',
  },
  description:
    'Photography by Hilary Tang. The world is very, very beautiful if you look at it.',
  openGraph: {
    // Just the name. The home card has no image, so it renders as two lines of
    // text — and the description directly beneath already opens with
    // "Photography by Hilary Tang", which made the longer form say it twice.
    title: 'Hilary Tang',
    description:
      'Photography by Hilary Tang. The world is very, very beautiful if you look at it.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAFAF8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes on <body> before hydration; this ignores only that, not
          real mismatches inside the tree. */}
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
