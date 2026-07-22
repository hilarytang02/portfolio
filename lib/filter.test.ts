import { describe, it, expect } from 'vitest';
import type { Photo, Continent, Category, MediumType } from '@/types/photo';
import {
  emptyFilterState,
  filterPhotos,
  computeCounts,
  activeFilterCount,
  isFilterActive,
  type FilterState,
} from './filter';

// Minimal photo factory — only the fields the filter reads matter.
function photo(
  id: string,
  continent: Continent,
  country: string,
  category: Category,
  camera: string,
  type: MediumType,
  filmStock?: string,
): Photo {
  return {
    id,
    filename: `${id}.webp`,
    width: 1000,
    height: 1000,
    featured: false,
    location: { city: id, country, continent },
    year: 2024,
    medium: { type, camera, ...(filmStock ? { filmStock } : {}) },
    category,
  };
}

const F = 'nikon-lite-touch-100w';
const D = 'nikon-coolpix-s33';
const P = 'iphone-15';

const PHOTOS: Photo[] = [
  photo('pt-city', 'Europe', 'Portugal', 'city', F, 'film', 'Portra 400'),
  photo('pt-nature', 'Europe', 'Portugal', 'nature', D, 'digital'),
  photo('es-people', 'Europe', 'Spain', 'people', P, 'phone'),
  photo('jp-city', 'Asia', 'Japan', 'city', F, 'film', 'Superia 400'),
  photo('jp-nature', 'Asia', 'Japan', 'nature', D, 'digital'),
  photo('vn-people', 'Asia', 'Vietnam', 'people', F, 'film', 'Portra 400'),
  photo('us-city', 'North America', 'United States', 'city', P, 'phone'),
];

function state(overrides: Partial<FilterState>): FilterState {
  return { ...emptyFilterState(), ...overrides };
}

const ids = (photos: Photo[]) => photos.map((p) => p.id).sort();

describe('filterPhotos', () => {
  it('returns everything when no filter is active', () => {
    expect(filterPhotos(PHOTOS, emptyFilterState())).toHaveLength(PHOTOS.length);
  });

  it("OR's multiple selections within a group", () => {
    // category = city OR people
    const result = filterPhotos(PHOTOS, state({ category: ['city', 'people'] }));
    expect(ids(result)).toEqual(
      ids([
        PHOTOS[0], // pt-city
        PHOTOS[2], // es-people
        PHOTOS[3], // jp-city
        PHOTOS[5], // vn-people
        PHOTOS[6], // us-city
      ]),
    );
  });

  it("AND's across groups", () => {
    // camera = film AND category = city  => only film+city photos
    const result = filterPhotos(
      PHOTOS,
      state({ camera: [F], category: ['city'] }),
    );
    expect(ids(result)).toEqual(ids([PHOTOS[0], PHOTOS[3]])); // pt-city, jp-city
  });

  it('matches film stock only for film photos', () => {
    const result = filterPhotos(PHOTOS, state({ filmStock: ['Portra 400'] }));
    expect(ids(result)).toEqual(ids([PHOTOS[0], PHOTOS[5]])); // pt-city, vn-people
  });
});

describe('continent → country cascade', () => {
  it('selecting a continent shows all its countries', () => {
    const result = filterPhotos(PHOTOS, state({ continent: ['Europe'] }));
    expect(ids(result)).toEqual(ids([PHOTOS[0], PHOTOS[1], PHOTOS[2]]));
  });

  it('narrowing to a country restricts only that continent', () => {
    // Europe + Asia selected, but narrowed to Portugal within Europe.
    // Asia has no country narrowing, so all Asian photos remain.
    const result = filterPhotos(
      PHOTOS,
      state({ continent: ['Europe', 'Asia'], country: ['Portugal'] }),
    );
    expect(ids(result)).toEqual(
      ids([
        PHOTOS[0], // pt-city (Portugal)
        PHOTOS[1], // pt-nature (Portugal)
        PHOTOS[3], // jp-city (Asia, not narrowed)
        PHOTOS[4], // jp-nature
        PHOTOS[5], // vn-people
      ]),
    );
    // Spain (Europe) is excluded because Europe was narrowed to Portugal.
    expect(ids(result)).not.toContain('es-people');
  });

  it("OR's multiple countries within the same continent", () => {
    const result = filterPhotos(
      PHOTOS,
      state({ continent: ['Europe'], country: ['Portugal', 'Spain'] }),
    );
    expect(ids(result)).toEqual(ids([PHOTOS[0], PHOTOS[1], PHOTOS[2]]));
  });
});

describe('computeCounts (faceted)', () => {
  it('counts each option against the other groups only', () => {
    const counts = computeCounts(PHOTOS, emptyFilterState());
    expect(counts.continent).toEqual({
      Europe: 3,
      Asia: 3,
      'North America': 1,
    });
    expect(counts.category).toEqual({ city: 3, nature: 2, people: 2 });
    expect(counts.filmStock).toEqual({ 'Portra 400': 2, 'Superia 400': 1 });
  });

  it("selecting one option in a group doesn't zero out siblings in that group", () => {
    // Choose category = city. The category facet counts should still reflect
    // the full library (own group excluded), so people/nature stay clickable.
    const counts = computeCounts(PHOTOS, state({ category: ['city'] }));
    expect(counts.category).toEqual({ city: 3, nature: 2, people: 2 });
  });

  it('reflects other active groups in a facet count', () => {
    // camera = film narrows the pool; continent counts should follow.
    const counts = computeCounts(PHOTOS, state({ camera: [F] }));
    // Film photos: pt-city (Europe), jp-city (Asia), vn-people (Asia)
    expect(counts.continent).toEqual({ Europe: 1, Asia: 2 });
    expect(counts.continent['North America']).toBeUndefined();
  });

  it('country counts only include countries within selected continents', () => {
    const counts = computeCounts(PHOTOS, state({ continent: ['Europe'] }));
    expect(counts.country).toEqual({ Portugal: 2, Spain: 1 });
    expect(counts.country['Japan']).toBeUndefined();
  });
});

describe('filter state helpers', () => {
  it('activeFilterCount sums selections across groups', () => {
    expect(activeFilterCount(emptyFilterState())).toBe(0);
    expect(
      activeFilterCount(state({ continent: ['Europe'], category: ['city', 'nature'] })),
    ).toBe(3);
  });

  it('isFilterActive reflects any selection', () => {
    expect(isFilterActive(emptyFilterState())).toBe(false);
    expect(isFilterActive(state({ camera: [F] }))).toBe(true);
  });
});
