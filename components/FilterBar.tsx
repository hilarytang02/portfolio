'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import FilterGroup, { type FilterOption } from './FilterGroup';
import { CAMERAS } from '@/data/cameras';
import { FILTER_KEYS, type FilterKey, type FilterState } from '@/lib/filter';

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
  showCountryRow: boolean;
  resultCount: number;
}

const LABEL_STYLE = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
} as const;

export function activeChips(
  groups: FilterGroups,
  state: FilterState,
): { key: FilterKey; value: string; label: string }[] {
  const of = (opts: FilterOption[]) =>
    Object.fromEntries(opts.map((o) => [o.value, o.label] as const));
  const labels: Record<FilterKey, Record<string, string>> = {
    continent: of(groups.continent),
    country: of(groups.country),
    category: of(groups.category),
    camera: of(groups.camera),
    filmStock: of(groups.filmStock),
  };
  return FILTER_KEYS.flatMap((key) =>
    state[key].map((value) => ({ key, value, label: labels[key][value] ?? value })),
  );
}

function Trigger({
  label,
  valueLabel,
  count,
  open,
  onClick,
}: {
  label: string;
  valueLabel: string | null;
  count: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="inline-flex items-baseline gap-1.5"
      style={LABEL_STYLE}
    >
      <span
        className="inline-flex items-baseline"
        style={{ color: count > 0 || open ? '#1A1A1A' : '#6B6B6B', transition: 'color 150ms' }}
      >
        {label}
        {valueLabel && (
          <span
            className="ml-1 inline-block max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap align-bottom text-ink-secondary"
          >
            : {valueLabel}
          </span>
        )}
      </span>
      {count > 0 && !valueLabel && (
        <span className="text-ink-tertiary tabular-nums" style={{ fontSize: '10px' }}>
          {count}
        </span>
      )}
      <span
        aria-hidden
        className="text-ink-tertiary"
        style={{ fontSize: '8px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
      >
        ▼
      </span>
    </button>
  );
}

/**
 * Desktop filter bar (PRD §5.4, refined): minimal group triggers that open
 * popovers anchored beneath them, a live result count, removable active chips,
 * and arrow-key navigation inside each dropdown. A trigger shows its single
 * selected value inline ("Medium: iPhone 15"); Film Stock only appears once a
 * film camera is selected.
 */
export default function FilterBar({
  groups,
  state,
  onToggle,
  onClear,
  active,
  showCountryRow,
  resultCount,
}: FilterViewProps) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Move focus to the first option when a dropdown opens (roving focus below).
  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLElement>(
      '[data-filter-panel] input:not([disabled])',
    );
    first?.focus();
  }, [open]);

  // Arrow-key navigation among the options within the open dropdown.
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const inputs = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('input:not([disabled])'),
    );
    if (inputs.length === 0) return;
    e.preventDefault();
    const i = inputs.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % inputs.length : (i - 1 + inputs.length) % inputs.length;
    inputs[next]?.focus();
  };

  const filmSelected = state.camera.some(
    (k) => CAMERAS[k as keyof typeof CAMERAS]?.type === 'film',
  );
  const chips = activeChips(groups, state);
  const labelOf = (key: FilterKey, value: string) =>
    chips.find((c) => c.key === key && c.value === value)?.label ?? value;

  // For the trigger's inline value: the label when exactly one is selected.
  const single = (values: string[]): string | null =>
    values.length === 1 ? values[0] : null;
  const locationValues = [
    ...state.continent.map((v) => labelOf('continent', v)),
    ...state.country.map((v) => labelOf('country', v)),
  ];

  const triggers: {
    key: string;
    label: string;
    count: number;
    valueLabel: string | null;
    panel: React.ReactNode;
  }[] = [
    {
      key: 'location',
      label: 'Location',
      count: state.continent.length + state.country.length,
      valueLabel: single(locationValues),
      panel: (
        <div className="flex flex-col gap-4">
          <FilterGroup label="Continent" name="continent" layout="menu" options={groups.continent} selected={state.continent} onToggle={(v) => onToggle('continent', v)} subdued />
          {showCountryRow && groups.country.length > 0 && (
            <div className="border-t border-rule/60 pt-4">
              <FilterGroup label="Country" name="country" layout="menu" options={groups.country} selected={state.country} onToggle={(v) => onToggle('country', v)} subdued />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      count: state.category.length,
      valueLabel: single(state.category.map((v) => labelOf('category', v))),
      panel: <FilterGroup label="Category" name="category" layout="menu" options={groups.category} selected={state.category} onToggle={(v) => onToggle('category', v)} subdued />,
    },
    {
      key: 'medium',
      label: 'Medium',
      count: state.camera.length,
      valueLabel: single(state.camera.map((v) => labelOf('camera', v))),
      panel: <FilterGroup label="Camera" name="camera" layout="menu" options={groups.camera} selected={state.camera} onToggle={(v) => onToggle('camera', v)} subdued />,
    },
    ...(filmSelected
      ? [{
          key: 'filmStock',
          label: 'Film Stock',
          count: state.filmStock.length,
          valueLabel: single(state.filmStock.map((v) => labelOf('filmStock', v))),
          panel: <FilterGroup label="Film Stock" name="filmStock" layout="menu" options={groups.filmStock} selected={state.filmStock} onToggle={(v) => onToggle('filmStock', v)} subdued />,
        }]
      : []),
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="sticky top-0 z-30 hidden border-b border-rule bg-bg/90 backdrop-blur-md md:block">
        <div ref={ref} className="mx-auto max-w-page px-6 md:px-10">
          <div className="flex items-center gap-8 py-4">
            {triggers.map((t) => (
              <div key={t.key} className="relative">
                <Trigger
                  label={t.label}
                  valueLabel={t.valueLabel}
                  count={t.count}
                  open={open === t.key}
                  onClick={() => setOpen((o) => (o === t.key ? null : t.key))}
                />
                <AnimatePresence>
                  {open === t.key && (
                    <motion.div
                      data-filter-panel
                      onKeyDown={onPanelKeyDown}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="absolute left-0 top-full z-40 mt-3 max-h-[min(60vh,420px)] overflow-y-auto border border-rule bg-bg p-4 shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                      style={{ minWidth: 240, maxWidth: 'min(560px, 82vw)' }}
                    >
                      {t.panel}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="ml-auto flex items-center gap-6">
              <span
                className="text-ink-tertiary tabular-nums"
                style={LABEL_STYLE}
                aria-hidden
              >
                {resultCount} {resultCount === 1 ? 'photo' : 'photos'}
              </span>
              {active && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-ink-secondary transition-colors hover:text-ink"
                  style={LABEL_STYLE}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {active && (
            <div className="flex flex-wrap items-center gap-2 pb-4">
              {chips.map(({ key, value, label }) => (
                <button
                  key={`${key}-${value}`}
                  type="button"
                  onClick={() => onToggle(key, value)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-ink transition-colors hover:border-ink"
                  style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  aria-label={`Remove filter ${label}`}
                >
                  {label}
                  <span className="text-ink-tertiary transition-colors group-hover:text-ink">×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
