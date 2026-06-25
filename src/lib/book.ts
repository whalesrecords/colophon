/**
 * Common normalized book shape produced by the isbn-lookup cascade.
 * Every source (Google Books, Open Library, BnF) is mapped onto this schema
 * before being cached in `book_metadata`.
 */

export type BookSource = 'google_books' | 'open_library' | 'bnf';

/** Bibliographic fields a parser can extract from a single source. */
export interface ParsedBook {
  title: string | null;
  subtitle: string | null;
  authors: string[] | null;
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  language: string | null;
  coverUrl: string | null;
  description: string | null;
}

/** A fully-resolved book, ready to upsert into book_metadata. */
export interface NormalizedBook extends ParsedBook {
  isbn13: string;
  source: BookSource;
  raw: unknown;
}

export const EMPTY_PARSED: ParsedBook = {
  title: null,
  subtitle: null,
  authors: null,
  publisher: null,
  publishedDate: null,
  pageCount: null,
  language: null,
  coverUrl: null,
  description: null,
};

/** True when a parse produced at least a title — i.e. the source had the book. */
export function hasUsableData(parsed: ParsedBook | null): parsed is ParsedBook {
  return !!parsed && !!parsed.title;
}
