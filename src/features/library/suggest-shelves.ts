import { type FacetKey, facetValues } from './faceting';
import type { LibraryItem } from './use-library';

export interface ShelfSuggestion {
  key: string;
  /** The shelf name to create. */
  label: string;
  facet: FacetKey;
  value: string;
  itemIds: string[];
  count: number;
}

const FACETS: FacetKey[] = ['author', 'publisher', 'genre', 'decade', 'language'];
const MIN_BOOKS = 4;
const MAX_SUGGESTIONS = 12;

const LANG: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  ja: 'Japonais',
  it: 'Italien',
  es: 'Espagnol',
  de: 'Allemand',
  pt: 'Portugais',
  nl: 'Néerlandais',
  zh: 'Chinois',
  ru: 'Russe',
  ko: 'Coréen',
};

function labelFor(facet: FacetKey, value: string): string {
  if (facet === 'decade') return `Années ${value.replace('s', '')}`;
  if (facet === 'language') return LANG[value] ?? value;
  return value;
}

/**
 * Suggest custom shelves from library clusters: any author / publisher / genre /
 * decade / language with at least MIN_BOOKS books that isn't already a shelf.
 * The user decides which to create. Pure + testable.
 */
export function suggestShelves(
  items: LibraryItem[],
  existingShelfNames: string[],
): ShelfSuggestion[] {
  const taken = new Set(existingShelfNames.map((n) => n.trim().toLowerCase()));
  const buckets = new Map<
    string,
    { facet: FacetKey; label: string; value: string; ids: string[] }
  >();

  for (const item of items) {
    for (const facet of FACETS) {
      for (const value of facetValues(item, facet)) {
        if (!value) continue;
        const label = labelFor(facet, value);
        if (taken.has(label.toLowerCase())) continue;
        const key = `${facet}:${value}`;
        const bucket = buckets.get(key) ?? { facet, label, value, ids: [] };
        bucket.ids.push(item.id);
        buckets.set(key, bucket);
      }
    }
  }

  return [...buckets.entries()]
    .map(([key, b]) => ({
      key,
      label: b.label,
      facet: b.facet,
      value: b.value,
      itemIds: b.ids,
      count: b.ids.length,
    }))
    .filter((s) => s.count >= MIN_BOOKS)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, MAX_SUGGESTIONS);
}
