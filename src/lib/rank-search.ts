import type { BookSearchResult } from './book-search-parsers';

/**
 * Surface canonical editions first. Print-on-demand reprints (which Google Books
 * tends to return first) usually have no publisher and no cover; real editions
 * (Gallimard, Folio…) carry both. Stable: ties keep their original order.
 */
export function rankSearchResults(results: BookSearchResult[]): BookSearchResult[] {
  const score = (r: BookSearchResult) => (r.publisher ? 2 : 0) + (r.coverUrl ? 1 : 0);
  return results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => score(b.r) - score(a.r) || a.i - b.i)
    .map((x) => x.r);
}
