/**
 * Backfill `tone` (mean CIELAB color) for every entry in data/photos.json by
 * reading the images in /public/photos/. New photos get tone automatically via
 * the shared pipeline; this exists for the pre-tone backlog and for re-runs
 * after editing images in place.
 *
 *   npm run extract-tones           # fill missing tones only
 *   npm run extract-tones -- --all  # recompute every photo
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Photo } from '../types/photo';
import { extractTone, PHOTOS_DIR } from './image-pipeline';
import { orderedPhoto } from './photo-cli';

const PHOTOS_JSON = path.join(process.cwd(), 'data', 'photos.json');

async function main() {
  const recomputeAll = process.argv.includes('--all');
  const photos = JSON.parse(fs.readFileSync(PHOTOS_JSON, 'utf8')) as Photo[];

  let done = 0;
  let skipped = 0;
  for (const p of photos) {
    if (p.tone && !recomputeAll) {
      skipped++;
      continue;
    }
    const file = path.join(PHOTOS_DIR, p.filename);
    if (!fs.existsSync(file)) {
      console.warn(`  ⚠ ${p.id}: ${p.filename} missing on disk, skipped`);
      continue;
    }
    p.tone = await extractTone(file);
    done++;
  }

  fs.writeFileSync(PHOTOS_JSON, JSON.stringify(photos.map(orderedPhoto), null, 2) + '\n');
  console.log(`✓ tones written — ${done} computed, ${skipped} already present.`);
}

main().catch((err) => {
  console.error(`✗ ${err?.message ?? err}`);
  process.exit(1);
});
