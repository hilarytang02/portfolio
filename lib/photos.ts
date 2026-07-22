import photosData from '@/data/photos.json';
import type { Photo, Continent, Category } from '@/types/photo';
import { CAMERA_KEYS, type CameraKey } from '@/data/cameras';

const ALL_PHOTOS = photosData as unknown as Photo[];

/**
 * Sort order (PRD §4.3): featured first, then by year descending, then by id
 * ascending for stability. This same order applies within the featured and
 * non-featured groups, so a single comparator handles both.
 */
export function sortPhotos(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.year !== b.year) return b.year - a.year;
    return a.id.localeCompare(b.id);
  });
}

/** All photos, sorted. The single source the grid renders from. */
export function getPhotos(): Photo[] {
  return sortPhotos(ALL_PHOTOS);
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
