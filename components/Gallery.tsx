'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import type { Photo } from '@/types/photo';
import { cameraLabel, CAMERAS } from '@/data/cameras';
import { deriveFilterOptions } from '@/lib/photos';
import {
  emptyFilterState,
  filterPhotos,
  computeCounts,
  buildCountryToContinent,
  isFilterActive,
  activeFilterCount,
  type FilterKey,
  type FilterState,
} from '@/lib/filter';
import { useFilterQueryState } from '@/lib/useFilterQueryState';
import PhotoGrid from './PhotoGrid';
import FilterBar, { type FilterGroups } from './FilterBar';
import FilterSheet from './FilterSheet';
import Lightbox from './Lightbox';

interface GalleryProps {
  photos: Photo[];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Client orchestrator: owns filter state, derives the faceted view model, and
 * renders the filter UI + grid. (URL syncing and the lightbox are wired in
 * later build steps.)
 */
export default function Gallery({ photos }: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const openLightbox = useCallback((i: number, el: HTMLButtonElement) => {
    openerRef.current = el;
    setOpenIndex(i);
  }, []);

  const closeLightbox = useCallback(() => {
    setOpenIndex(null);
    // Return focus to the grid item that opened it (PRD §6).
    openerRef.current?.focus();
  }, []);

  const options = useMemo(() => deriveFilterOptions(photos), [photos]);
  const countryToContinent = useMemo(
    () => buildCountryToContinent(photos),
    [photos],
  );
  const [state, setState] = useFilterQueryState(options);
  const filtered = useMemo(() => filterPhotos(photos, state), [photos, state]);
  const counts = useMemo(() => computeCounts(photos, state), [photos, state]);

  // Cascade: only countries within selected continents are offered (PRD §5.2).
  const visibleCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of state.continent) {
      for (const country of options.countriesByContinent[c] ?? []) set.add(country);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [state.continent, options]);

  const groups: FilterGroups = useMemo(
    () => ({
      continent: options.continents.map((c) => ({
        value: c,
        label: c,
        count: counts.continent[c] ?? 0,
      })),
      country: visibleCountries.map((c) => ({
        value: c,
        label: c,
        count: counts.country[c] ?? 0,
      })),
      category: options.categories.map((c) => ({
        value: c,
        label: cap(c),
        count: counts.category[c] ?? 0,
      })),
      camera: options.cameras.map((k) => ({
        value: k,
        label: cameraLabel(k),
        count: counts.camera[k] ?? 0,
      })),
      filmStock: options.filmStocks.map((s) => ({
        value: s,
        label: s,
        count: counts.filmStock[s] ?? 0,
      })),
    }),
    [options, visibleCountries, counts],
  );

  const onToggle = useCallback(
    (key: FilterKey, value: string) => {
      setState((prev) => {
        const set = new Set(prev[key]);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        const next: FilterState = { ...prev, [key]: [...set] };
        // Deselecting a continent clears its countries (PRD §5.2).
        if (key === 'continent' && !set.has(value)) {
          next.country = prev.country.filter(
            (c) => countryToContinent[c] !== value,
          );
        }
        // Film stock only applies to film — clear it if no film camera remains.
        if (key === 'camera') {
          const stillFilm = next.camera.some(
            (k) => CAMERAS[k as keyof typeof CAMERAS]?.type === 'film',
          );
          if (!stillFilm) next.filmStock = [];
        }
        return next;
      });
    },
    [countryToContinent, setState],
  );

  const onClear = useCallback(() => setState(() => emptyFilterState()), [setState]);

  const active = isFilterActive(state);
  const activeCount = activeFilterCount(state);

  // Derive a valid open index: if filtering shrank the set past the open photo,
  // the lightbox closes on its own (no state sync needed).
  const lightboxIndex =
    openIndex !== null && openIndex < filtered.length ? openIndex : null;

  return (
    <>
      <FilterBar
        groups={groups}
        state={state}
        onToggle={onToggle}
        onClear={onClear}
        active={active}
        showCountryRow={state.continent.length > 0}
        resultCount={filtered.length}
      />

      {/* Mobile trigger (PRD §5.4): result count + a FILTER (n) button. */}
      <div className="sticky top-0 z-30 border-b border-rule bg-bg/90 backdrop-blur-md md:hidden">
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          <span className="text-ink-tertiary tabular-nums" aria-hidden>
            {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
          </span>
          <button type="button" onClick={() => setSheetOpen(true)} className="text-ink">
            Filter{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>

      <FilterSheet
        groups={groups}
        state={state}
        onToggle={onToggle}
        onClear={onClear}
        active={active}
        showCountryRow={state.continent.length > 0}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        resultCount={filtered.length}
      />

      {/* Announce result count to assistive tech on filter change (PRD §8). */}
      <div aria-live="polite" className="sr-only">
        {filtered.length} photos match the current filters.
      </div>

      <div className="mx-auto max-w-page px-6 pb-24 pt-8 md:px-10">
        {filtered.length > 0 ? (
          <PhotoGrid photos={filtered} onOpen={openLightbox} />
        ) : (
          <div className="py-10 text-center">
            <p
              className="text-ink-secondary"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              No photos match these filters.
            </p>
            {active && (
              <button
                type="button"
                onClick={onClear}
                className="mt-4 text-ink-secondary underline transition-colors hover:text-ink"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <Lightbox
        photos={filtered}
        index={lightboxIndex}
        onClose={closeLightbox}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
