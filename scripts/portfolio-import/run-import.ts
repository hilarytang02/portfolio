/**
 * One-off: consumes the manifest + category classifications, processes every
 * source image through the shared pipeline (converting HEIC/HEIF via `sips`
 * first), REPLACES the placeholder samples, and writes data/photos.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { processImage, PHOTOS_DIR } from '../image-pipeline';
import type { Photo } from '../../types/photo';

const OUT_DIR = process.env.OUT_DIR || '/tmp/portfolio-import';
const TMP = path.join(OUT_DIR, 'tmp');
const PHOTOS_JSON = path.join(process.cwd(), 'data', 'photos.json');

interface Entry {
  index: number;
  source: string;
  base: string;
  medium: 'digital' | 'film' | 'phone';
  city: string;
  country: string;
  continent: string;
  year: number;
  camera: string;
  filmStock?: string;
  id: string;
}

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
  out.location = { city: p.location.city, country: p.location.country, continent: p.location.continent };
  out.year = p.year;
  const medium: Record<string, unknown> = { type: p.medium.type, camera: p.medium.camera };
  if (p.medium.filmStock !== undefined) medium.filmStock = p.medium.filmStock;
  out.medium = medium;
  out.category = p.category;
  return out;
}

const MEDIUM_TYPE = { digital: 'digital', film: 'film', phone: 'phone' } as const;

async function main() {
  const entries = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'manifest.json'), 'utf8')) as Entry[];
  // Category + featured are keyed by stable basename so they survive a re-import
  // that reorders entries (e.g. after fixing folder names).
  const catByBase = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, 'categories-by-base.json'), 'utf8'),
  ) as Record<string, string>;
  const featuredBases = new Set(
    JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'featured-bases.json'), 'utf8')) as string[],
  );

  fs.mkdirSync(TMP, { recursive: true });
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  // Replace the placeholder samples: remove all existing webp files.
  for (const f of fs.readdirSync(PHOTOS_DIR)) {
    if (f.endsWith('.webp')) fs.rmSync(path.join(PHOTOS_DIR, f));
  }

  const photos: Photo[] = [];
  for (const e of entries) {
    let source = e.source;
    const ext = path.extname(source).toLowerCase();
    if (ext === '.heic' || ext === '.heif') {
      const jpg = path.join(TMP, `src-${e.index}.jpg`);
      execFileSync('sips', ['-s', 'format', 'jpeg', source, '--out', jpg], { stdio: 'ignore' });
      source = jpg;
    }

    const { width, height, blurDataURL } = await processImage(source, e.id);
    const category = catByBase[e.base];
    if (!category) throw new Error(`No category for ${e.base}`);
    photos.push({
      id: e.id,
      filename: `${e.id}.webp`,
      width,
      height,
      blurDataURL,
      featured: featuredBases.has(e.base),
      location: { city: e.city, country: e.country, continent: e.continent as Photo['location']['continent'] },
      year: e.year,
      medium: {
        type: MEDIUM_TYPE[e.medium],
        camera: e.camera,
        ...(e.filmStock ? { filmStock: e.filmStock } : {}),
      },
      category: category as Photo['category'],
    });
    if (e.index % 20 === 0) process.stdout.write(`  … ${e.index + 1}/${entries.length}\n`);
  }

  fs.writeFileSync(PHOTOS_JSON, JSON.stringify(photos.map(orderedPhoto), null, 2) + '\n');
  console.log(`\n✓ Imported ${photos.length} photos → data/photos.json (samples replaced)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
