import { parseSeries, seriesKey } from '@/lib/series';

import type { LibraryItem } from './use-library';

export interface SeriesGroup {
  key: string;
  name: string;
  /** Volumes owned, sorted by volume number ascending. */
  items: LibraryItem[];
  /** Lowest-volume item, used for the stack cover. */
  cover: LibraryItem;
  count: number;
}

/**
 * Group a library into series stacks (2+ owned volumes of the same series) and
 * the remaining standalone books, preserving the incoming order for singles.
 */
export function groupBySeries(items: LibraryItem[]): {
  groups: SeriesGroup[];
  singles: LibraryItem[];
} {
  const map = new Map<
    string,
    { name: string; list: { item: LibraryItem; volume: number | null }[] }
  >();
  for (const item of items) {
    const title = item.book?.title;
    if (!title) continue;
    const ref = parseSeries(title);
    // Fall back to the bare title so manga whose metadata has no tome number
    // (e.g. every volume titled just "Berserk") still groups as a series.
    const name = ref?.name ?? title;
    const volume = ref?.volume ?? null;
    const key = seriesKey(name);
    if (!key) continue;
    const entry = map.get(key) ?? { name, list: [] };
    entry.list.push({ item, volume });
    if (name.length > entry.name.length) entry.name = name;
    map.set(key, entry);
  }

  const grouped = new Set<string>();
  const groups: SeriesGroup[] = [];
  for (const [key, entry] of map) {
    if (entry.list.length < 2) continue;
    entry.list.sort((a, b) => {
      if (a.volume != null && b.volume != null) return a.volume - b.volume;
      if (a.volume != null) return -1;
      if (b.volume != null) return 1;
      // Both lack a tome number: order by publication date, then ISBN (≈ tome order).
      const ad = a.item.book?.published_date ?? '';
      const bd = b.item.book?.published_date ?? '';
      if (ad !== bd) return ad.localeCompare(bd);
      return (a.item.book?.isbn13 ?? '').localeCompare(b.item.book?.isbn13 ?? '');
    });
    groups.push({
      key,
      name: entry.name,
      items: entry.list.map((x) => x.item),
      cover: entry.list[0].item,
      count: entry.list.length,
    });
    for (const x of entry.list) grouped.add(x.item.id);
  }
  groups.sort((a, b) => a.name.localeCompare(b.name));

  const singles = items.filter((i) => !grouped.has(i.id));
  return { groups, singles };
}
