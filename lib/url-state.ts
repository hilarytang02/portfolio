import type { FilterState } from './filter';
import type { FilterOptions } from './photos';

/**
 * Filter state <-> URL query string (PRD §5.5). Values are slugified so shared
 * links read cleanly (`?continent=europe&country=portugal,spain`), then mapped
 * back to their canonical form using the option lists derived from the data.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Map URL slugs back to canonical values, dropping any that don't match. */
export function fromSlugs(slugs: string[], canonical: readonly string[]): string[] {
  const bySlug = new Map(canonical.map((v) => [slugify(v), v]));
  const out: string[] = [];
  for (const s of slugs) {
    const v = bySlug.get(s);
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Every country present, across all continents. */
export function allCountries(options: FilterOptions): string[] {
  return Object.values(options.countriesByContinent).flat();
}

/** The five URL param keys, in the order they appear in the query string. */
export const URL_KEYS = {
  continent: 'continent',
  country: 'country',
  category: 'category',
  camera: 'camera',
  film: 'film',
} as const;

export type RawUrlState = {
  continent: string[];
  country: string[];
  category: string[];
  camera: string[];
  film: string[];
};

export function rawToState(
  raw: RawUrlState,
  options: FilterOptions,
): FilterState {
  return {
    continent: fromSlugs(raw.continent, options.continents),
    country: fromSlugs(raw.country, allCountries(options)),
    category: fromSlugs(raw.category, options.categories),
    camera: fromSlugs(raw.camera, options.cameras),
    filmStock: fromSlugs(raw.film, options.filmStocks),
  };
}

export function stateToRaw(state: FilterState): RawUrlState {
  return {
    continent: state.continent.map(slugify),
    country: state.country.map(slugify),
    category: state.category.map(slugify),
    camera: state.camera.map(slugify),
    film: state.filmStock.map(slugify),
  };
}

const RAW_KEYS: (keyof RawUrlState)[] = [
  'continent',
  'country',
  'category',
  'camera',
  'film',
];

/** Parse a `location.search` string into raw slug arrays. */
export function parseSearch(search: string): RawUrlState {
  const sp = new URLSearchParams(search);
  const get = (k: string) =>
    sp.get(k)?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  return {
    continent: get('continent'),
    country: get('country'),
    category: get('category'),
    camera: get('camera'),
    film: get('film'),
  };
}

/**
 * Build a query string from filter state. Built by hand (not URLSearchParams)
 * so commas stay literal — `country=portugal,spain` (PRD §5.5). Empty groups
 * are omitted entirely.
 */
export function buildSearch(state: FilterState): string {
  const raw = stateToRaw(state);
  const parts: string[] = [];
  for (const key of RAW_KEYS) {
    const values = raw[key];
    if (values.length) parts.push(`${key}=${values.map(encodeURIComponent).join(',')}`);
  }
  return parts.join('&');
}
