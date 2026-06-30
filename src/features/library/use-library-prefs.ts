import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { EMPTY_FILTERS, type Filters, type SortKey } from '@/features/library/faceting';

export type GridSize = 'XXS' | 'XS' | 'S' | 'M' | 'L';

export interface LibraryPrefs {
  view: 'grid' | 'list';
  size: GridSize;
  group: boolean;
  sort: SortKey;
  filters: Filters;
}

const DEFAULT: LibraryPrefs = {
  view: 'grid',
  size: 'M',
  group: true,
  sort: 'added',
  filters: EMPTY_FILTERS,
};
const KEY = 'colophon.libraryPrefs';

function resolve<T>(action: SetStateAction<T>, prev: T): T {
  return typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
}

/**
 * Library view/filter/sort, persisted so the reader's choices survive navigation +
 * app restarts (AsyncStorage — works on web + native). Mirrors the theme-pref
 * pattern: load once on mount, save on every change.
 */
export function useLibraryPrefs() {
  const [prefs, setPrefs] = useState<LibraryPrefs>(DEFAULT);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v) {
          try {
            const p = JSON.parse(v) as Partial<LibraryPrefs>;
            setPrefs((s) => ({ ...s, ...p, filters: { ...EMPTY_FILTERS, ...(p.filters ?? {}) } }));
          } catch {
            // ignore corrupt prefs
          }
        }
        loaded.current = true;
      })
      .catch(() => {
        loaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
  }, [prefs]);

  return useMemo(() => {
    const make =
      <K extends keyof LibraryPrefs>(key: K): Dispatch<SetStateAction<LibraryPrefs[K]>> =>
      (action) =>
        setPrefs((s) => ({ ...s, [key]: resolve(action, s[key]) }));
    return {
      view: prefs.view,
      setView: make('view'),
      size: prefs.size,
      setSize: make('size'),
      group: prefs.group,
      setGroup: make('group'),
      sort: prefs.sort,
      setSort: make('sort'),
      filters: prefs.filters,
      setFilters: make('filters'),
    };
  }, [prefs]);
}
