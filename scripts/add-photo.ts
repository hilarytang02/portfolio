/**
 * Interactive CLI to add one photo (PRD §3.1). Prompts for metadata, processes
 * the image through the shared pipeline, appends to data/photos.json (schema key
 * order, 2-space indent), and prints the git commands to run.
 *
 *   npm run add-photo
 *   npm run add-photo -- --file=x.jpg --city=Lisboa --country=Portugal \
 *     --continent=Europe --type=film --camera=nikon-lite-touch-100w \
 *     --film="Kodak Portra 400" --category=city [--year=2024] [--featured] [--title="…"]
 */
import fs from 'node:fs';
import { input } from '@inquirer/prompts';
import {
  CONTINENTS,
  CATEGORIES,
  MEDIUM_TYPES,
  type Continent,
  type Category,
  type MediumType,
} from '../types/photo';
import { CAMERAS, isCameraKey } from '../data/cameras';
import {
  cleanPath,
  promptMetadata,
  addPhoto,
  CURRENT_YEAR,
  type PhotoSpec,
} from './photo-cli';

function parseFlags(argv: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? true;
  }
  return flags;
}

/** Build a spec entirely from flags (non-interactive path, PRD §3.1). */
function specFromFlags(flags: Record<string, string | boolean>): PhotoSpec {
  const str = (k: string) => (typeof flags[k] === 'string' ? (flags[k] as string) : undefined);
  const req = (k: string) => {
    const v = str(k);
    if (!v) throw new Error(`Missing required flag --${k}`);
    return v;
  };

  const source = cleanPath(req('file'));
  if (!fs.existsSync(source)) throw new Error(`File not found: "${source}"`);

  const continent = CONTINENTS.find(
    (c) => c.toLowerCase() === req('continent').toLowerCase(),
  ) as Continent | undefined;
  if (!continent) throw new Error(`Invalid --continent "${str('continent')}"`);

  const category = CATEGORIES.find((c) => c === req('category').toLowerCase()) as
    | Category
    | undefined;
  if (!category) throw new Error(`Invalid --category "${str('category')}"`);

  const type = MEDIUM_TYPES.find((t) => t === req('type').toLowerCase()) as
    | MediumType
    | undefined;
  if (!type) throw new Error(`Invalid --type "${str('type')}"`);

  const camera = req('camera');
  if (!isCameraKey(camera)) throw new Error(`Invalid --camera "${camera}" (not in CAMERAS)`);
  if (CAMERAS[camera].type !== type) {
    throw new Error(`--camera "${camera}" is a ${CAMERAS[camera].type} camera, not ${type}`);
  }

  const filmStock = str('film');
  if (type === 'film' && !filmStock) throw new Error('--film is required when --type=film');
  if (type !== 'film' && filmStock) throw new Error('--film is only valid when --type=film');

  const year = str('year') ? Number(str('year')) : CURRENT_YEAR;
  if (Number.isNaN(year) || year < 1950 || year > CURRENT_YEAR) {
    throw new Error(`--year ${str('year')} outside 1950–${CURRENT_YEAR}`);
  }

  return {
    source,
    city: req('city'),
    country: req('country'),
    continent,
    year,
    type,
    camera,
    filmStock,
    category,
    featured: flags.featured === true || flags.featured === 'true',
    title: str('title'),
  };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  let spec: PhotoSpec;
  if (flags.file) {
    spec = specFromFlags(flags);
  } else {
    const source = cleanPath(await input({ message: 'Source image path:' }));
    if (!source || !fs.existsSync(source)) throw new Error(`File not found: "${source}"`);
    spec = await promptMetadata(source);
  }

  const id = await addPhoto(spec);

  console.log('\nNext steps:');
  console.log(`  git add public/photos/${id}.webp data/photos.json`);
  console.log(`  git commit -m "Add photo: ${id}"`);
  console.log('  git push\n');
}

main().catch((err) => {
  if (err?.name === 'ExitPromptError') {
    console.log('\nCancelled.');
    process.exit(0);
  }
  console.error(`\n✗ ${err?.message ?? err}`);
  process.exit(1);
});
