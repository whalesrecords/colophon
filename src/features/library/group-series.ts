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
  const map = new Map<string, { name: string; list: { item: LibraryItem; volume: number }[] }>();
  for (const item of items) {
    const ref = parseSeries(item.book?.title);
    if (!ref) continue;
    const key = seriesKey(ref.name);
    const entry = map.get(key) ?? { name: ref.name, list: [] };
    entry.list.push({ item, volume: ref.volume });
    if (ref.name.length > entry.name.length) entry.name = ref.name;
    map.set(key, entry);
  }

  const grouped = new Set<string>();
  const groups: SeriesGroup[] = [];
  for (const [key, entry] of map) {
    if (entry.list.length < 2) continue;
    entry.list.sort((a, b) => a.volume - b.volume);
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
