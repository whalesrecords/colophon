import { normalizeIsbn } from './isbn';

/**
 * Extract the valid, de-duplicated ISBN-13s from a pasted blob of text — one
 * per line, or comma/space/semicolon separated, or a column copied out of a
 * Goodreads/LibraryThing/Calibre export. Tokens that aren't valid ISBN-10/13
 * are ignored.
 */
export function parseIsbnList(text: string): string[] {
  const tokens = text.split(/[\s,;]+/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const result = normalizeIsbn(trimmed);
    if (result.ok && !seen.has(result.isbn13)) {
      seen.add(result.isbn13);
      out.push(result.isbn13);
    }
  }
  return out;
}
