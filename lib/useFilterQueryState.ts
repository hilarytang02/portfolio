'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { FilterState } from './filter';
import type { FilterOptions } from './photos';
import { rawToState, parseSearch, buildSearch } from './url-state';

/**
 * Filter state backed by the URL query string (PRD §5.5), read through
 * `useSyncExternalStore` so the page stays statically generated with the full
 * grid in the HTML: the server snapshot is empty (all photos), and the client
 * reconciles to the real URL after hydration without a mismatch. Writes use
 * `history.replaceState` (no navigation, no scroll) and notify subscribers.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function notify() {
  for (const l of listeners) l();
}

const getClientSearch = () => window.location.search;
const getServerSearch = () => '';

export function useFilterQueryState(
  options: FilterOptions,
): readonly [FilterState, (updater: (prev: FilterState) => FilterState) => void] {
  const search = useSyncExternalStore(subscribe, getClientSearch, getServerSearch);

  const state = useMemo(
    () => rawToState(parseSearch(search), options),
    [search, options],
  );

  const setState = useCallback(
    (updater: (prev: FilterState) => FilterState) => {
      const prev = rawToState(parseSearch(window.location.search), options);
      const next = updater(prev);
      const qs = buildSearch(next);
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      notify();
    },
    [options],
  );

  return [state, setState] as const;
}
