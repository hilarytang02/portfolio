import type { Photo } from '@/types/photo';

/**
 * Pure filter logic — no React, so it is unit-testable in isolation (PRD §9).
 *
 * Model (PRD §5.1): within a group, selections are OR'd; across groups, AND'd.
 * "Location" is one visual group split into two facets — `continent` and
 * `country` — that cascade (PRD §5.2).
 */
export interface FilterState {
  continent: string[];
  country: string[];
  category: string[];
  camera: string[];
  filmStock: string[];
}

export const FILTER_KEYS = [
  'continent',
  'country',
  'category',
  'camera',
  'filmStock',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export function emptyFilterState(): FilterState {
  return { continent: [], country: [], category: [], camera: [], filmStock: [] };
}

export function isFilterActive(state: FilterState): boolean {
  return FILTER_KEYS.some((k) => state[k].length > 0);
}

/** Total number of individual selections across all groups (for `FILTER (3)`). */
export function activeFilterCount(state: FilterState): number {
  return FILTER_KEYS.reduce((n, k) => n + state[k].length, 0);
}

/** Map each country to the continent it appears in (one continent in practice). */
export function buildCountryToContinent(photos: Photo[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of photos) map[p.location.country] = p.location.continent;
  return map;
}

/**
 * Does a photo satisfy the filter state? `ignore` drops one facet from the
 * test — used to compute faceted counts (PRD §5.3), where an option's count is
 * measured against every filter *except its own group*.
 */
export function matchesFilters(
  photo: Photo,
  state: FilterState,
  countryToContinent: Record<string, string>,
  ignore?: FilterKey,
): boolean {
  if (
    ignore !== 'category' &&
    state.category.length &&
    !state.category.includes(photo.category)
  ) {
    return false;
  }

  if (
    ignore !== 'camera' &&
    state.camera.length &&
    !state.camera.includes(photo.medium.camera)
  ) {
    return false;
  }

  if (
    ignore !== 'filmStock' &&
    state.filmStock.length &&
    !(photo.medium.filmStock && state.filmStock.includes(photo.medium.filmStock))
  ) {
    return false;
  }

  if (
    ignore !== 'continent' &&
    state.continent.length &&
    !state.continent.includes(photo.location.continent)
  ) {
    return false;
  }

  // Cascade: a selected country narrows *only its own continent*. Continents
  // with no selected country still show all their photos (PRD §5.2), which is
  // why the plain continent-AND-country intersection is not enough.
  if (ignore !== 'country' && state.country.length) {
    const narrowedContinents = new Set(
      state.country.map((c) => countryToContinent[c]).filter(Boolean),
    );
    if (
      narrowedContinents.has(photo.location.continent) &&
      !state.country.includes(photo.location.country)
    ) {
      return false;
    }
  }

  return true;
}

/** Filter a photo list, preserving input order. */
export function filterPhotos(photos: Photo[], state: FilterState): Photo[] {
  const countryToContinent = buildCountryToContinent(photos);
  return photos.filter((p) => matchesFilters(p, state, countryToContinent));
}

export interface FacetCounts {
  continent: Record<string, number>;
  country: Record<string, number>;
  category: Record<string, number>;
  camera: Record<string, number>;
  filmStock: Record<string, number>;
}

function inc(rec: Record<string, number>, key: string) {
  rec[key] = (rec[key] ?? 0) + 1;
}

/**
 * Faceted counts (PRD §5.3): for every option, the number of photos it would
 * yield given the *other* active filters. Computed per facet by excluding that
 * facet's own selections, so choosing a second option in a group never zeroes
 * out the first.
 */
export function computeCounts(photos: Photo[], state: FilterState): FacetCounts {
  const countryToContinent = buildCountryToContinent(photos);
  const counts: FacetCounts = {
    continent: {},
    country: {},
    category: {},
    camera: {},
    filmStock: {},
  };

  for (const key of FILTER_KEYS) {
    for (const p of photos) {
      if (!matchesFilters(p, state, countryToContinent, key)) continue;
      switch (key) {
        case 'continent':
          inc(counts.continent, p.location.continent);
          break;
        case 'country':
          inc(counts.country, p.location.country);
          break;
        case 'category':
          inc(counts.category, p.category);
          break;
        case 'camera':
          inc(counts.camera, p.medium.camera);
          break;
        case 'filmStock':
          if (p.medium.filmStock) inc(counts.filmStock, p.medium.filmStock);
          break;
      }
    }
  }

  return counts;
}
