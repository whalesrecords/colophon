/**
 * ISBN normalization & validation — pure, dependency-free.
 *
 * The EAN-13 barcode on the back of a book IS its ISBN-13 (prefix 978/979).
 * This module strips formatting, validates the check digit, and converts
 * ISBN-10 <-> ISBN-13 so the rest of the app only ever deals with a single
 * canonical key: the 13-digit ISBN.
 *
 * Kept free of React Native / Deno imports so it can be shared verbatim by
 * the Expo app and the `isbn-lookup` Supabase Edge Function.
 */

export type IsbnError =
  | 'empty'
  | 'bad_length'
  | 'bad_characters'
  | 'bad_check_digit'
  | 'bad_prefix';

export type NormalizeResult =
  | { ok: true; isbn13: string; isbn10: string | null }
  | { ok: false; error: IsbnError };

/** Strip everything that is not a digit or a trailing X (ISBN-10 check char). */
export function cleanIsbnInput(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/** Validate an ISBN-13 string (13 digits, valid mod-10 check digit). */
export function isValidIsbn13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  return value[12] === computeIsbn13CheckDigit(value.slice(0, 12));
}

/** Validate an ISBN-10 string (9 digits + digit|X, valid mod-11 check digit). */
export function isValidIsbn10(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  return value[9] === computeIsbn10CheckDigit(value.slice(0, 9));
}

/** Compute the ISBN-13 check digit from the first 12 digits. */
export function computeIsbn13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

/** Compute the ISBN-10 check digit (may be 'X') from the first 9 digits. */
export function computeIsbn10CheckDigit(first9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(first9[i]) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? 'X' : String(check);
}

/** Convert a valid ISBN-10 to its ISBN-13 (978-prefixed) equivalent. */
export function isbn10To13(isbn10: string): string {
  const core = '978' + isbn10.slice(0, 9);
  return core + computeIsbn13CheckDigit(core);
}

/**
 * Convert a 978-prefixed ISBN-13 back to ISBN-10.
 * Returns null for 979-prefixed ISBNs, which have no ISBN-10 form.
 * Useful for sources (e.g. the BnF catalogue) that index older books by ISBN-10.
 */
export function isbn13To10(isbn13: string): string | null {
  if (!isbn13.startsWith('978')) return null;
  const core = isbn13.slice(3, 12);
  return core + computeIsbn10CheckDigit(core);
}

/**
 * Normalize arbitrary scanner / keyboard input into a canonical ISBN-13.
 * Accepts ISBN-10 or ISBN-13 with spaces/hyphens; rejects anything invalid.
 */
export function normalizeIsbn(raw: string): NormalizeResult {
  const cleaned = cleanIsbnInput(raw ?? '');
  if (cleaned.length === 0) return { ok: false, error: 'empty' };

  if (cleaned.length === 10) {
    if (!/^\d{9}[\dX]$/.test(cleaned)) return { ok: false, error: 'bad_characters' };
    if (!isValidIsbn10(cleaned)) return { ok: false, error: 'bad_check_digit' };
    return { ok: true, isbn13: isbn10To13(cleaned), isbn10: cleaned };
  }

  if (cleaned.length === 13) {
    if (!/^\d{13}$/.test(cleaned)) return { ok: false, error: 'bad_characters' };
    if (!(cleaned.startsWith('978') || cleaned.startsWith('979'))) {
      return { ok: false, error: 'bad_prefix' };
    }
    if (!isValidIsbn13(cleaned)) return { ok: false, error: 'bad_check_digit' };
    return { ok: true, isbn13: cleaned, isbn10: isbn13To10(cleaned) };
  }

  return { ok: false, error: 'bad_length' };
}

/** Convenience: canonical ISBN-13 or null. */
export function toIsbn13(raw: string): string | null {
  const result = normalizeIsbn(raw);
  return result.ok ? result.isbn13 : null;
}
