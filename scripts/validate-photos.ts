/**
 * Validates data/photos.json against the rules in PRD §2.3. Runs in `prebuild`
 * and as a lint step. Errors are collected and printed as a list (each tagged
 * with the offending id), and a non-empty list fails the build.
 *
 *   npm run validate-photos
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONTINENTS, CATEGORIES } from '../types/photo';
import { CAMERAS, isCameraKey } from '../data/cameras';

// Defaults to data/photos.json; an explicit path can be passed for testing.
const PHOTOS_JSON = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'data', 'photos.json');
const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const CURRENT_YEAR = new Date().getFullYear();

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];

  let photos: unknown;
  try {
    photos = JSON.parse(fs.readFileSync(PHOTOS_JSON, 'utf8'));
  } catch (err) {
    console.error(`✗ Could not read/parse data/photos.json: ${String(err)}`);
    process.exit(1);
  }

  if (!Array.isArray(photos)) {
    console.error('✗ data/photos.json must be an array.');
    process.exit(1);
  }

  const filesOnDisk = fs.existsSync(PHOTOS_DIR)
    ? fs.readdirSync(PHOTOS_DIR).filter((f) => f.endsWith('.webp'))
    : [];
  const referenced = new Set<string>();
  const seenIds = new Set<string>();

  photos.forEach((raw, i) => {
    const p = raw as Record<string, any>;
    const id: string = typeof p.id === 'string' && p.id ? p.id : `#${i}`;
    const err = (msg: string) => errors.push(`[${id}] ${msg}`);

    if (typeof p.id !== 'string' || !p.id) {
      err('missing or non-string "id"');
    } else if (seenIds.has(p.id)) {
      err(`duplicate id "${p.id}"`);
    } else {
      seenIds.add(p.id);
    }

    // filename must exist on disk
    if (typeof p.filename !== 'string' || !p.filename) {
      err('missing "filename"');
    } else {
      referenced.add(p.filename);
      if (!filesOnDisk.includes(p.filename)) {
        err(`file not found in /public/photos/: "${p.filename}"`);
      }
    }

    // dimensions
    if (!p.width || typeof p.width !== 'number' || p.width <= 0) {
      err('missing or zero "width"');
    }
    if (!p.height || typeof p.height !== 'number' || p.height <= 0) {
      err('missing or zero "height"');
    }

    // year
    if (typeof p.year !== 'number' || p.year < 1950 || p.year > CURRENT_YEAR) {
      err(`year ${p.year} outside 1950–${CURRENT_YEAR}`);
    }

    // location
    const continent = p.location?.continent;
    if (!CONTINENTS.includes(continent)) {
      err(`continent "${continent}" is not a valid Continent`);
    }

    // category
    if (!CATEGORIES.includes(p.category)) {
      err(`category "${p.category}" is not a valid Category`);
    }

    // medium: camera + film-stock rules
    const medium = p.medium ?? {};
    const camera: string = medium.camera;
    const type: string = medium.type;

    if (typeof camera !== 'string' || !isCameraKey(camera)) {
      err(`camera "${camera}" is not in CAMERAS`);
    } else if (CAMERAS[camera].type !== type) {
      err(
        `camera "${camera}" is a ${CAMERAS[camera].type} camera but medium.type is "${type}"`,
      );
    }

    // tone drives the grid's color ordering — missing is a warning, not an error
    if (!p.tone || typeof p.tone.l !== 'number') {
      warnings.push(`[${id}] no tone data — run \`npm run extract-tones\``);
    }

    if (type === 'film' && !medium.filmStock) {
      err('medium.type is "film" but no filmStock given');
    }
    if (type !== 'film' && medium.filmStock) {
      err(`medium.type is "${type}" but a filmStock ("${medium.filmStock}") is set`);
    }
  });

  // Orphan files: on disk but not referenced (warn, don't fail).
  for (const f of filesOnDisk) {
    if (!referenced.has(f)) {
      warnings.push(`file "${f}" is in /public/photos/ but has no entry in photos.json`);
    }
  }

  if (warnings.length) {
    console.warn(`\n⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length) {
    console.error(`\n✗ photos.json validation failed — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log(`✓ photos.json valid — ${photos.length} photo(s), no errors.`);
}

main();
