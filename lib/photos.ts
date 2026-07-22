import photosData from '@/data/photos.json';
import type { Photo, Continent, Category } from '@/types/photo';
import { CAMERA_KEYS, type CameraKey } from '@/data/cameras';

const ALL_PHOTOS = photosData as unknown as Photo[];

function orientation(p: Photo): 'L' | 'P' {
  return p.width >= p.height ? 'L' : 'P';
}
const loc = (p: Photo) => `${p.location.country}/${p.location.city}`;

/** Deterministic phase in [0,1) from a string (FNV-1a) — staggers buckets. */
function phase(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Aesthetic spread (deterministic): each photo gets a position in [0,1) equal
 * to its evenly-spaced slot within its location's set (j/count) offset by a
 * per-location phase, then everything is sorted by that position. So every
 * place is distributed *evenly* across the whole grid — the biggest trip (San
 * Francisco) is spaced out rather than front-loaded or clumped, small places
 * scatter instead of piling in the middle, and no two neighbours share a
 * location. Stable across reloads — fixed base sort + a fixed hash, no
 * per-load randomness.
 */
function spread(photos: Photo[]): Photo[] {
  const buckets = new Map<string, Photo[]>();
  for (const p of [...photos].sort((a, b) => a.id.localeCompare(b.id))) {
    (buckets.get(loc(p)) ?? buckets.set(loc(p), []).get(loc(p))!).push(p);
  }

  const scored: { p: Photo; score: number; key: string }[] = [];
  for (const [key, arr] of buckets) {
    const ph = phase(key);
    arr.forEach((p, j) => {
      scored.push({ p, key, score: ((j + 0.5) / arr.length + ph) % 1 });
    });
  }

  scored.sort(
    (a, b) => a.score - b.score || a.key.localeCompare(b.key) || a.p.id.localeCompare(b.p.id),
  );
  return scored.map((s) => s.p);
}

/** Grid order: a single deterministic aesthetic spread over all photos. */
export function orderPhotos(photos: Photo[]): Photo[] {
  return spread(photos);
}

/** All photos, ordered. The single source the grid renders from. */
export function getPhotos(): Photo[] {
  return orderPhotos(ALL_PHOTOS);
}

/** Aggregate stats for the hero scope line (unique cities + year range). */
export function getPhotoStats(): { cities: number; minYear: number; maxYear: number } {
  const cities = new Set(ALL_PHOTOS.map((p) => p.location.city)).size;
  const years = ALL_PHOTOS.map((p) => p.year);
  return { cities, minYear: Math.min(...years), maxYear: Math.max(...years) };
}

/** Alt text (PRD §8): the title when present, otherwise generated from metadata. */
export function altText(photo: Photo): string {
  if (photo.title) return photo.title;
  const { city, country } = photo.location;
  return `${photo.category} photograph taken in ${city}, ${country}, ${photo.year}`;
}

export interface FilterOptions {
  continents: Continent[];
  /** Countries grouped under the continent they appear in. */
  countriesByContinent: Record<string, string[]>;
  categories: Category[];
  cameras: CameraKey[];
  filmStocks: string[];
}

/**
 * Derive every filter option from the data itself (PRD §5.2), so an empty
 * option can never render. Options are sorted for stable, predictable UI.
 */
export function deriveFilterOptions(photos: Photo[]): FilterOptions {
  const continents = new Set<Continent>();
  const countriesByContinent: Record<string, Set<string>> = {};
  const categories = new Set<Category>();
  const cameras = new Set<string>();
  const filmStocks = new Set<string>();

  for (const p of photos) {
    continents.add(p.location.continent);
    (countriesByContinent[p.location.continent] ??= new Set()).add(
      p.location.country,
    );
    categories.add(p.category);
    cameras.add(p.medium.camera);
    if (p.medium.filmStock) filmStocks.add(p.medium.filmStock);
  }

  return {
    continents: [...continents].sort((a, b) => a.localeCompare(b)),
    countriesByContinent: Object.fromEntries(
      Object.entries(countriesByContinent).map(([k, v]) => [
        k,
        [...v].sort((a, b) => a.localeCompare(b)),
      ]),
    ),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    // Preserve the canonical CAMERAS declaration order, filtered to those present.
    cameras: CAMERA_KEYS.filter((k) => cameras.has(k)),
    filmStocks: [...filmStocks].sort((a, b) => a.localeCompare(b)),
  };
}
