import type { LibraryItem } from './use-library';

export type FacetKey = 'status' | 'genre' | 'author' | 'publisher' | 'language' | 'decade';
export type SortKey = 'added' | 'title' | 'author' | 'year' | 'rating';

export const FACET_KEYS: FacetKey[] = [
  'status',
  'genre',
  'author',
  'publisher',
  'language',
  'decade',
];

export interface Filters {
  search: string;
  facets: Record<FacetKey, string[]>;
}

export const EMPTY_FILTERS: Filters = {
  search: '',
  facets: { status: [], genre: [], author: [], publisher: [], language: [], decade: [] },
};

export function activeFilterCount(filters: Filters): number {
  return FACET_KEYS.reduce((n, k) => n + filters.facets[k].length, 0);
}

function yearOf(item: LibraryItem): number | null {
  const m = item.book?.published_date?.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

function decadeOf(item: LibraryItem): string | null {
  const y = yearOf(item);
  return y ? `${Math.floor(y / 10) * 10}s` : null;
}

/** The facet values an item belongs to for a given facet. */
export function facetValues(item: LibraryItem, key: FacetKey): string[] {
  switch (key) {
    case 'status':
      return [item.status];
    case 'genre':
      return item.book?.genres ?? [];
    case 'author':
      return item.book?.authors ?? [];
    case 'publisher':
      return item.book?.publisher ? [item.book.publisher] : [];
    case 'language':
      return item.book?.language ? [item.book.language] : [];
    case 'decade': {
      const d = decadeOf(item);
      return d ? [d] : [];
    }
  }
}

function matchesSearch(item: LibraryItem, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [item.book?.title, ...(item.book?.authors ?? []), item.book?.isbn13, item.book?.publisher]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

function matchesFacet(item: LibraryItem, key: FacetKey, selected: string[]): boolean {
  if (!selected.length) return true;
  const vals = facetValues(item, key);
  return selected.some((s) => vals.includes(s));
}

/** Apply search + all facet filters (optionally excluding one facet, for counts). */
export function applyFilters(
  items: LibraryItem[],
  filters: Filters,
  except?: FacetKey,
): LibraryItem[] {
  return items.filter((item) => {
    if (!matchesSearch(item, filters.search)) return false;
    for (const key of FACET_KEYS) {
      if (key === except) continue;
      if (!matchesFacet(item, key, filters.facets[key])) return false;
    }
    return true;
  });
}

export interface FacetValueCount {
  value: string;
  count: number;
}

/** Counts per facet value, narrowed by every OTHER active filter (the funnel). */
export function computeFacets(
  items: LibraryItem[],
  filters: Filters,
): Record<FacetKey, FacetValueCount[]> {
  const result = {} as Record<FacetKey, FacetValueCount[]>;
  for (const key of FACET_KEYS) {
    const base = applyFilters(items, filters, key);
    const counts = new Map<string, number>();
    for (const item of base) {
      for (const v of facetValues(item, key)) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    result[key] = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }
  return result;
}

export function sortItems(items: LibraryItem[], sort: SortKey): LibraryItem[] {
  const copy = [...items];
  switch (sort) {
    case 'title':
      return copy.sort((a, b) => (a.book?.title ?? '').localeCompare(b.book?.title ?? ''));
    case 'author':
      return copy.sort((a, b) =>
        (a.book?.authors?.[0] ?? '').localeCompare(b.book?.authors?.[0] ?? ''),
      );
    case 'year':
      return copy.sort((a, b) => (yearOf(b) ?? 0) - (yearOf(a) ?? 0));
    case 'rating':
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'added':
    default:
      return copy; // already newest-first from the query
  }
}
