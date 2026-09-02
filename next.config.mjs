/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local photos live in /public/photos and are pre-optimized to .webp by the
    // add-photo pipeline (long edge <= 2400px, q82, blurDataURL baked into
    // data/photos.json). Vercel's on-the-fly optimizer was therefore doing
    // redundant work while every hit counted against the free tier's Image
    // Optimization cache-read quota — the limit we were approaching.
    //
    // `unoptimized` serves the files straight from /public via the CDN: no
    // /_next/image rewrite, no transformation, no cache reads. The tradeoff is
    // that next/image no longer emits a srcset, so every viewport downloads the
    // same 2400px file and the `sizes` attributes become inert for selection.
    // They're kept in the components so responsive behaviour returns intact if
    // this is ever flipped back. To cut bytes further, the pipeline would need
    // to emit per-breakpoint widths and a hand-built srcset.
    unoptimized: true,
    // Moot while unoptimized (no format negotiation), kept for the same reason.
    formats: ['image/webp'],
  },
};

export default nextConfig;
