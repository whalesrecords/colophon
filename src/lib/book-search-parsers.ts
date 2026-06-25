/**
 * Pure parsers for multi-result book search (Google Books / Open Library
 * search endpoints). Kept separate from book-parsers.ts (single-volume lookup)
 * and dependency-light so it can be shared by the app and the book-search
 * Deno edge function.
 */
import { isbn10To13 } from './isbn';

export interface BookSearchResult {
  isbn13: string;
  title: string | null;
  subtitle: string | null;
  authors: string[] | null;
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
}

/** Upgrade a Google Books image link to a clean https URL. */
function cleanGoogleCover(links: Record<string, string> | undefined): string | null {
  if (!links) return null;
  const raw = links.thumbnail ?? links.smallThumbnail;
  if (!raw) return null;
  return raw.replace(/^http:/, 'https:').replace(/&edge=curl/, '');
}

/** Map a Google Books search response to candidates that carry an ISBN-13. */
export function parseGoogleBooksSearch(json: unknown): BookSearchResult[] {
  const root = json as { items?: Array<{ volumeInfo?: Record<string, any> }> };
  if (!Array.isArray(root?.items)) return [];

  const seen = new Set<string>();
  const results: BookSearchResult[] = [];
  for (const item of root.items) {
    const info = item?.volumeInfo;
    if (!info) continue;
    const ids: Array<{ type?: string; identifier?: string }> = Array.isArray(
      info.industryIdentifiers,
    )
      ? info.industryIdentifiers
      : [];
    let isbn13: string | null = ids.find((i) => i.type === 'ISBN_13')?.identifier ?? null;
    if (!isbn13) {
      const isbn10 = ids.find((i) => i.type === 'ISBN_10')?.identifier;
      if (isbn10 && /^[0-9]{9}[0-9X]$/i.test(isbn10)) isbn13 = isbn10To13(isbn10.toUpperCase());
    }
    if (!isbn13 || !/^[0-9]{13}$/.test(isbn13) || seen.has(isbn13)) continue;
    seen.add(isbn13);
    results.push({
      isbn13,
      title: info.title ?? null,
      subtitle: info.subtitle ?? null,
      authors: Array.isArray(info.authors) && info.authors.length ? info.authors : null,
      publisher: info.publisher ?? null,
      publishedDate: info.publishedDate ?? null,
      coverUrl: cleanGoogleCover(info.imageLinks),
    });
  }
  return results;
}

/** Map an Open Library search.json response (?fields=...) to ISBN-13 candidates. */
export function parseOpenLibrarySearch(json: unknown): BookSearchResult[] {
  const docs = (json as { docs?: Array<Record<string, any>> })?.docs;
  if (!Array.isArray(docs)) return [];

  const seen = new Set<string>();
  const results: BookSearchResult[] = [];
  for (const doc of docs) {
    const isbns: string[] = Array.isArray(doc.isbn) ? doc.isbn : [];
    let isbn13: string | null =
      isbns.find((x) => /^[0-9]{13}$/.test(x) && (x.startsWith('978') || x.startsWith('979'))) ??
      null;
    if (!isbn13) {
      const isbn10 = isbns.find((x) => /^[0-9]{9}[0-9X]$/i.test(x));
      if (isbn10) isbn13 = isbn10To13(isbn10.toUpperCase());
    }
    if (!isbn13 || seen.has(isbn13)) continue;
    seen.add(isbn13);
    results.push({
      isbn13,
      title: doc.title ?? null,
      subtitle: null,
      authors: Array.isArray(doc.author_name) && doc.author_name.length ? doc.author_name : null,
      publisher: Array.isArray(doc.publisher) && doc.publisher.length ? doc.publisher[0] : null,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`,
    });
  }
  return results;
}
