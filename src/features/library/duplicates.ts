import type { LibraryItem } from './use-library';

export interface DuplicateGroup {
  isbn13: string;
  title: string;
  author: string | null;
  count: number;
  ids: string[];
}

/** Number of copies the user owns per ISBN. */
export function copiesByIsbn(items: LibraryItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.book?.isbn13;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** ISBNs owned more than once. */
export function duplicateIsbns(items: LibraryItem[]): Set<string> {
  const set = new Set<string>();
  for (const [isbn, n] of copiesByIsbn(items)) if (n > 1) set.add(isbn);
  return set;
}

/** Groups of duplicated books (owned 2+ times), most-copied first. */
export function duplicateGroups(items: LibraryItem[]): DuplicateGroup[] {
  const groups = new Map<string, DuplicateGroup>();
  for (const item of items) {
    const key = item.book?.isbn13;
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.ids.push(item.id);
    } else {
      groups.set(key, {
        isbn13: key,
        title: item.book?.title ?? 'Sans titre',
        author: item.book?.authors?.[0] ?? null,
        count: 1,
        ids: [item.id],
      });
    }
  }
  return [...groups.values()]
    .filter((g) => g.count > 1)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}
