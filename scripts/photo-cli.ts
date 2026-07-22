/**
 * Shared building blocks for the add-photo and import-photos CLIs: metadata
 * prompting, id derivation, schema-ordered serialization, and the append step.
 */
import fs from 'node:fs';
import path from 'node:path';
import { input, select, number, confirm, search } from '@inquirer/prompts';
import {
  CONTINENTS,
  CATEGORIES,
  MEDIUM_TYPES,
  type Continent,
  type Category,
  type MediumType,
  type Photo,
} from '../types/photo';
import { CAMERAS, CAMERA_KEYS } from '../data/cameras';
import { processImage } from './image-pipeline';

export const PHOTOS_JSON = path.join(process.cwd(), 'data', 'photos.json');
export const CURRENT_YEAR = new Date().getFullYear();

export interface PhotoSpec {
  source: string;
  city: string;
  country: string;
  continent: Continent;
  year: number;
  type: MediumType;
  camera: string;
  filmStock?: string;
  category: Category;
  featured: boolean;
  title?: string;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Strip surrounding quotes/whitespace left by dragging a file into the terminal. */
export function cleanPath(s: string): string {
  return s.trim().replace(/^['"]|['"]$/g, '').trim();
}

export function readPhotos(): Photo[] {
  return JSON.parse(fs.readFileSync(PHOTOS_JSON, 'utf8')) as Photo[];
}

export function uniqueId(city: string, year: number, existing: Set<string>): string {
  const base = `${slugify(city)}-${year}`;
  let id = base;
  let n = 2;
  while (existing.has(id)) id = `${base}-${n++}`;
  return id;
}

export function camerasForType(type: MediumType) {
  return CAMERA_KEYS.filter((k) => CAMERAS[k].type === type);
}

/** Serialize with keys in the schema's declared order (PRD §3.1). */
export function orderedPhoto(p: Photo): Record<string, unknown> {
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

function autocomplete(message: string, existing: string[]) {
  return search<string>({
    message,
    source: (term) => {
      const t = (term ?? '').trim();
      const matches = existing.filter((c) => c.toLowerCase().includes(t.toLowerCase()));
      const choices = matches.map((c) => ({ name: c, value: c }));
      if (t && !existing.some((c) => c.toLowerCase() === t.toLowerCase())) {
        choices.push({ name: `Add “${t}”`, value: t });
      }
      return choices;
    },
  });
}

/** Prompt for all metadata for a given source file (PRD §3.1 step 2). */
export async function promptMetadata(source: string): Promise<PhotoSpec> {
  const photos = readPhotos();
  const countries = [...new Set(photos.map((p) => p.location.country))].sort();
  const stocks = [
    ...new Set(photos.map((p) => p.medium.filmStock).filter(Boolean) as string[]),
  ].sort();

  const city = (await input({ message: 'City:', validate: (v) => !!v.trim() || 'Required' })).trim();
  const country = (await autocomplete('Country:', countries)).trim();
  const continent = await select<Continent>({
    message: 'Continent:',
    choices: CONTINENTS.map((c) => ({ name: c, value: c })),
  });
  const year =
    (await number({ message: 'Year:', default: CURRENT_YEAR, min: 1950, max: CURRENT_YEAR })) ??
    CURRENT_YEAR;
  const type = await select<MediumType>({
    message: 'Medium type:',
    choices: MEDIUM_TYPES.map((t) => ({ name: t, value: t })),
  });

  const matching = camerasForType(type);
  let camera: string;
  if (matching.length === 1) {
    camera = matching[0];
    console.log(`  Camera: ${CAMERAS[matching[0]].label} (only ${type} camera, auto-selected)`);
  } else {
    camera = await select<string>({
      message: 'Camera:',
      choices: matching.map((k) => ({ name: CAMERAS[k].label, value: k })),
    });
  }

  let filmStock: string | undefined;
  if (type === 'film') {
    filmStock = (await autocomplete('Film stock:', stocks)).trim();
  }

  const category = await select<Category>({
    message: 'Category:',
    choices: CATEGORIES.map((c) => ({ name: c, value: c })),
  });
  const featured = await confirm({ message: 'Featured?', default: false });
  const titleRaw = (await input({ message: 'Title (optional, enter to skip):' })).trim();

  return {
    source,
    city,
    country,
    continent,
    year,
    type,
    camera,
    filmStock,
    category,
    featured,
    title: titleRaw || undefined,
  };
}

/**
 * Process the image and append the entry to photos.json (schema key order,
 * 2-space indent). With `dryRun`, nothing is written — it only reports the id.
 */
export async function addPhoto(
  spec: PhotoSpec,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<string> {
  const photos = readPhotos();
  const id = uniqueId(spec.city, spec.year, new Set(photos.map((p) => p.id)));

  if (dryRun) {
    console.log(`  [dry-run] would add "${id}" → public/photos/${id}.webp`);
    console.log(
      `  [dry-run] ${spec.city}, ${spec.country} · ${spec.continent} · ${spec.year} · ${spec.category}`,
    );
    return id;
  }

  console.log(`  Processing → public/photos/${id}.webp …`);
  const { width, height, blurDataURL } = await processImage(spec.source, id);

  const photo: Photo = {
    id,
    filename: `${id}.webp`,
    width,
    height,
    blurDataURL,
    featured: spec.featured,
    ...(spec.title ? { title: spec.title } : {}),
    location: { city: spec.city, country: spec.country, continent: spec.continent },
    year: spec.year,
    medium: {
      type: spec.type,
      camera: spec.camera,
      ...(spec.filmStock ? { filmStock: spec.filmStock } : {}),
    },
    category: spec.category,
  };

  photos.push(photo);
  fs.writeFileSync(PHOTOS_JSON, JSON.stringify(photos.map(orderedPhoto), null, 2) + '\n');
  console.log(`  ✓ ${id} (${width}×${height})`);
  return id;
}
