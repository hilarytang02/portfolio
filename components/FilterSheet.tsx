'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FilterGroup from './FilterGroup';
import type { FilterViewProps } from './FilterBar';

interface FilterSheetProps extends FilterViewProps {
  isOpen: boolean;
  onClose: () => void;
  resultCount: number;
}

const LABEL_STYLE = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
} as const;

function Accordion({
  label,
  selectedCount,
  children,
  defaultOpen = false,
}: {
  label: string;
  selectedCount: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-rule">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-ink"
        style={LABEL_STYLE}
      >
        <span>
          {label}
          {selectedCount > 0 && (
            <span className="ml-2 text-ink-tertiary">({selectedCount})</span>
          )}
        </span>
        <span aria-hidden className="text-ink-tertiary">
          {open ? '–' : '+'}
        </span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

/**
 * Mobile filter UI (PRD §5.4): a full-height bottom sheet with the groups as
 * collapsible accordions, and APPLY / CLEAR ALL pinned to the bottom. Filtering
 * is live, so APPLY simply closes the sheet to reveal the results.
 */
export default function FilterSheet({
  groups,
  state,
  onToggle,
  onClear,
  active,
  showCountryRow,
  isOpen,
  onClose,
  resultCount,
}: FilterSheetProps) {
  // Lock body scroll while the sheet is open, and close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 top-10 flex flex-col rounded-t-2xl bg-bg shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-rule px-6 py-4">
              <span className="text-ink" style={LABEL_STYLE}>
                Filters
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="text-ink-secondary transition-colors hover:text-ink"
                style={{ fontSize: '20px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <Accordion
                label="Location"
                selectedCount={state.continent.length + state.country.length}
                defaultOpen
              >
                <FilterGroup
                  label="Continent"
                  name="m-continent"
                  layout="stack"
                  options={groups.continent}
                  selected={state.continent}
                  onToggle={(v) => onToggle('continent', v)}
                  subdued
                />
                {showCountryRow && groups.country.length > 0 && (
                  <div className="mt-5">
                    <FilterGroup
                      label="Country"
                      name="m-country"
                      layout="stack"
                      options={groups.country}
                      selected={state.country}
                      onToggle={(v) => onToggle('country', v)}
                      subdued
                    />
                  </div>
                )}
              </Accordion>

              <Accordion label="Category" selectedCount={state.category.length}>
                <FilterGroup
                  label="Category"
                  name="m-category"
                  layout="stack"
                  options={groups.category}
                  selected={state.category}
                  onToggle={(v) => onToggle('category', v)}
                  subdued
                />
              </Accordion>

              <Accordion label="Medium" selectedCount={state.camera.length}>
                <FilterGroup
                  label="Camera"
                  name="m-camera"
                  layout="stack"
                  options={groups.camera}
                  selected={state.camera}
                  onToggle={(v) => onToggle('camera', v)}
                  subdued
                />
              </Accordion>

              <Accordion label="Film Stock" selectedCount={state.filmStock.length}>
                <FilterGroup
                  label="Film Stock"
                  name="m-filmStock"
                  layout="stack"
                  options={groups.filmStock}
                  selected={state.filmStock}
                  onToggle={(v) => onToggle('filmStock', v)}
                  subdued
                />
              </Accordion>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-rule px-6 py-4">
              <button
                type="button"
                onClick={onClear}
                disabled={!active}
                className="text-ink-secondary transition-colors hover:text-ink disabled:opacity-40"
                style={LABEL_STYLE}
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-ink px-6 py-3 text-bg"
                style={LABEL_STYLE}
              >
                {`Show ${resultCount} photo${resultCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
