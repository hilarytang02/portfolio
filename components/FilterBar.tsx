'use client';

import FilterGroup, { type FilterOption } from './FilterGroup';
import type { FilterKey, FilterState } from '@/lib/filter';

export interface FilterGroups {
  continent: FilterOption[];
  country: FilterOption[];
  category: FilterOption[];
  camera: FilterOption[];
  filmStock: FilterOption[];
}

export interface FilterViewProps {
  groups: FilterGroups;
  state: FilterState;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: () => void;
  active: boolean;
  /** Country sub-row only appears once a continent is selected (PRD §5.2). */
  showCountryRow: boolean;
}

/**
 * Desktop filter bar (PRD §5.4): a horizontal bar beneath the hero, sticky on
 * scroll with a blurred, 90%-opacity background. Active options are underlined,
 * not boxed. CLEAR ALL shows only when a filter is active.
 */
export default function FilterBar({
  groups,
  state,
  onToggle,
  onClear,
  active,
  showCountryRow,
}: FilterViewProps) {
  return (
    <div className="sticky top-0 z-30 hidden border-b border-rule bg-bg/90 backdrop-blur-md md:block">
      <div className="mx-auto max-w-page px-6 py-4 md:px-10">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          <FilterGroup
            label="Location"
            name="continent"
            options={groups.continent}
            selected={state.continent}
            onToggle={(v) => onToggle('continent', v)}
          />
          <FilterGroup
            label="Category"
            name="category"
            options={groups.category}
            selected={state.category}
            onToggle={(v) => onToggle('category', v)}
          />
          <FilterGroup
            label="Medium"
            name="camera"
            options={groups.camera}
            selected={state.camera}
            onToggle={(v) => onToggle('camera', v)}
          />
          <FilterGroup
            label="Film Stock"
            name="filmStock"
            options={groups.filmStock}
            selected={state.filmStock}
            onToggle={(v) => onToggle('filmStock', v)}
          />
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="ml-auto text-ink-secondary transition-colors hover:text-ink"
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

        {showCountryRow && groups.country.length > 0 && (
          <div className="mt-3 border-t border-rule/60 pt-3">
            <FilterGroup
              label="Country"
              name="country"
              options={groups.country}
              selected={state.country}
              onToggle={(v) => onToggle('country', v)}
              subdued
            />
          </div>
        )}
      </div>
    </div>
  );
}
