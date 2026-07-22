/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local photos live in /public/photos and are pre-optimized to .webp by the
    // add-photo pipeline. next/image still handles responsive resizing on Vercel.
    formats: ['image/webp'],
  },
};

export default nextConfig;
