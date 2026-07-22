/**
 * Dev helper: generates ~20 placeholder photos (gradient webp files + a
 * matching photos.json) so the grid and filters can be exercised before real
 * photos are imported. Safe to re-run; overwrites public/photos and photos.json.
 *
 *   npx tsx scripts/generate-placeholders.ts
 *
 * Not part of the shipping workflow — real photos come via `npm run import-photos`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { processImage, PHOTOS_DIR } from './image-pipeline';
import type { Photo } from '../types/photo';

interface Seed {
  city: string;
  country: string;
  continent: Photo['location']['continent'];
  year: number;
  type: Photo['medium']['type'];
  camera: string;
  filmStock?: string;
  category: Photo['category'];
  featured?: boolean;
  title?: string;
  ratio: [number, number];
}

const D = 'nikon-coolpix-s33';
const F = 'nikon-lite-touch-100w';
const P = 'iphone-15';

// Aspect ratios cycle to give the masonry mixed shapes.
const R = {
  portrait: [1067, 1600] as [number, number],
  tallPortrait: [1280, 1600] as [number, number],
  landscape: [1600, 1067] as [number, number],
  wide: [1600, 900] as [number, number],
  square: [1400, 1400] as [number, number],
  classic: [1600, 1200] as [number, number],
};

const SEEDS: Seed[] = [
  { city: 'Lisboa', country: 'Portugal', continent: 'Europe', year: 2024, type: 'film', camera: F, filmStock: 'Kodak Portra 400', category: 'city', featured: true, title: 'Alfama mornings', ratio: R.portrait },
  { city: 'Porto', country: 'Portugal', continent: 'Europe', year: 2023, type: 'digital', camera: D, category: 'city', ratio: R.landscape },
  { city: 'Barcelona', country: 'Spain', continent: 'Europe', year: 2024, type: 'phone', camera: P, category: 'people', ratio: R.tallPortrait },
  { city: 'Paris', country: 'France', continent: 'Europe', year: 2022, type: 'film', camera: F, filmStock: 'Kodak Gold 200', category: 'city', featured: true, title: 'Seine at dusk', ratio: R.wide },
  { city: 'Rome', country: 'Italy', continent: 'Europe', year: 2023, type: 'digital', camera: D, category: 'city', ratio: R.square },
  { city: 'Tokyo', country: 'Japan', continent: 'Asia', year: 2025, type: 'film', camera: F, filmStock: 'Fujifilm Superia 400', category: 'city', featured: true, title: 'Shinjuku neon', ratio: R.portrait },
  { city: 'Kyoto', country: 'Japan', continent: 'Asia', year: 2025, type: 'phone', camera: P, category: 'nature', title: 'Arashiyama', ratio: R.classic },
  { city: 'Hanoi', country: 'Vietnam', continent: 'Asia', year: 2023, type: 'film', camera: F, filmStock: 'Kodak Portra 400', category: 'people', ratio: R.portrait },
  { city: 'Bangkok', country: 'Thailand', continent: 'Asia', year: 2022, type: 'digital', camera: D, category: 'city', ratio: R.landscape },
  { city: 'New York', country: 'United States', continent: 'North America', year: 2024, type: 'film', camera: F, filmStock: 'Ilford HP5 Plus', category: 'city', featured: true, title: 'Midtown grid', ratio: R.tallPortrait },
  { city: 'San Francisco', country: 'United States', continent: 'North America', year: 2023, type: 'phone', camera: P, category: 'nature', ratio: R.wide },
  { city: 'Mexico City', country: 'Mexico', continent: 'North America', year: 2024, type: 'digital', camera: D, category: 'people', ratio: R.square },
  { city: 'Cusco', country: 'Peru', continent: 'South America', year: 2022, type: 'film', camera: F, filmStock: 'Kodak Gold 200', category: 'people', title: 'Sacred Valley', ratio: R.classic },
  { city: 'Buenos Aires', country: 'Argentina', continent: 'South America', year: 2023, type: 'phone', camera: P, category: 'city', ratio: R.portrait },
  { city: 'Marrakech', country: 'Morocco', continent: 'Africa', year: 2024, type: 'film', camera: F, filmStock: 'Fujifilm Superia 400', category: 'people', featured: true, title: 'The souk', ratio: R.landscape },
  { city: 'Sydney', country: 'Australia', continent: 'Oceania', year: 2025, type: 'digital', camera: D, category: 'nature', ratio: R.wide },
  { city: 'Queenstown', country: 'New Zealand', continent: 'Oceania', year: 2024, type: 'phone', camera: P, category: 'nature', featured: true, title: 'The Remarkables', ratio: R.landscape },
  { city: 'Cape Town', country: 'South Africa', continent: 'Africa', year: 2023, type: 'film', camera: F, filmStock: 'Kodak Portra 400', category: 'nature', ratio: R.classic },
  { city: 'Reykjavik', country: 'Iceland', continent: 'Europe', year: 2025, type: 'digital', camera: D, category: 'nature', featured: true, title: 'Blue hour', ratio: R.tallPortrait },
  { city: 'Lisboa', country: 'Portugal', continent: 'Europe', year: 2024, type: 'digital', camera: D, category: 'nature', ratio: R.square },
  { city: 'Hoi An', country: 'Vietnam', continent: 'Asia', year: 2023, type: 'phone', camera: P, category: 'people', ratio: R.portrait },
  { city: 'Chamonix', country: 'France', continent: 'Europe', year: 2022, type: 'film', camera: F, filmStock: 'Ilford HP5 Plus', category: 'nature', title: 'Mont Blanc', ratio: R.tallPortrait },
];

// Deterministic pleasant gradient pairs (warm, muted — matches the light site).
const PALETTE: [string, string][] = [
  ['#c9b8a8', '#8a7d72'],
  ['#a8bcc9', '#6f7f8a'],
  ['#c9a8b8', '#8a727d'],
  ['#b8c9a8', '#7d8a72'],
  ['#c9c1a8', '#8a8272'],
  ['#a8c9c1', '#728a82'],
  ['#bfa8c9', '#7d728a'],
  ['#c9b0a8', '#8a7672'],
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function placeholderSvg(
  [w, h]: [number, number],
  [c1, c2]: [string, string],
  city: string,
  sub: string,
): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="50%" y="49%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(w * 0.055)}" fill="#ffffff" opacity="0.92" letter-spacing="2">${city.toUpperCase()}</text>
  <text x="50%" y="49%" dy="${Math.round(w * 0.06)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(w * 0.026)}" fill="#ffffff" opacity="0.7" letter-spacing="3">${sub.toUpperCase()}</text>
</svg>`;
  return Buffer.from(svg);
}

/** Serialize a photo with keys in the schema's declared order (PRD §3.1). */
function orderedPhoto(p: Photo): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: p.id,
    filename: p.filename,
    width: p.width,
    height: p.height,
    blurDataURL: p.blurDataURL,
    featured: p.featured,
  };
  if (p.title !== undefined) out.title = p.title;
  out.location = {
    city: p.location.city,
    country: p.location.country,
    continent: p.location.continent,
  };
  out.year = p.year;
  const medium: Record<string, unknown> = {
    type: p.medium.type,
    camera: p.medium.camera,
  };
  if (p.medium.filmStock !== undefined) medium.filmStock = p.medium.filmStock;
  out.medium = medium;
  out.category = p.category;
  return out;
}

async function main() {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  // Clear previously generated placeholder webp files (keep .gitkeep).
  for (const f of fs.readdirSync(PHOTOS_DIR)) {
    if (f.endsWith('.webp')) fs.rmSync(path.join(PHOTOS_DIR, f));
  }

  const usedIds = new Set<string>();
  const photos: Photo[] = [];

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    const base = `${slug(seed.city)}-${seed.year}`;
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);

    const palette = PALETTE[i % PALETTE.length];
    const svg = placeholderSvg(seed.ratio, palette, seed.city, `${seed.country} · ${seed.year}`);
    const { width, height, blurDataURL } = await processImage(svg, id);

    photos.push({
      id,
      filename: `${id}.webp`,
      width,
      height,
      blurDataURL,
      featured: seed.featured ?? false,
      ...(seed.title ? { title: seed.title } : {}),
      location: { city: seed.city, country: seed.country, continent: seed.continent },
      year: seed.year,
      medium: {
        type: seed.type,
        camera: seed.camera,
        ...(seed.filmStock ? { filmStock: seed.filmStock } : {}),
      },
      category: seed.category,
    });
    process.stdout.write(`  ✓ ${id} (${width}×${height})\n`);
  }

  const jsonPath = path.join(process.cwd(), 'data', 'photos.json');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(photos.map(orderedPhoto), null, 2) + '\n',
  );
  console.log(`\nWrote ${photos.length} photos to data/photos.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
