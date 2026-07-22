import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Hilary Tang — Photography',
  description:
    'Photography by Hilary Tang. The world is very, very beautiful if you look at it.',
  openGraph: {
    title: 'Hilary Tang — Photography',
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
