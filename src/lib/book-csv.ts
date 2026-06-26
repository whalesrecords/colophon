import { normalizeIsbn } from './isbn';

export type ImportStatus = 'to_read' | 'reading' | 'read' | 'abandoned';

export interface ImportedBook {
  isbn13: string;
  rating: number | null;
  status: ImportStatus | null;
  notes: string | null;
}

export interface CsvImportResult {
  books: ImportedBook[];
  /** Rows that had no resolvable ISBN-13 (can't be looked up). */
  skipped: number;
}

/** A small RFC-4180-ish CSV tokenizer: quotes, "" escapes, embedded commas/newlines. */
export function parseCsvRows(text: string): string[][] {
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toIsbn13(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9Xx]/g, ''); // strips Goodreads' ="…" wrapper
  if (!cleaned) return null;
  const norm = normalizeIsbn(cleaned);
  return norm.ok ? norm.isbn13 : null;
}

function mapStatus(shelf: string): ImportStatus | null {
  const s = shelf.trim().toLowerCase();
  if (!s) return null;
  if (s === 'read' || s === 'lu' || s === 'lus') return 'read';
  if (s === 'currently-reading' || s === 'reading' || s.includes('cours')) return 'reading';
  if (s === 'to-read' || s === 'to_read' || s.includes('lire') || s.includes('envie')) return 'to_read';
  if (s.includes('abandon') || s === 'dnf') return 'abandoned';
  return null;
}

function mapRating(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(0.5, Math.min(5, n));
}

/**
 * Parse a Goodreads or Babelio CSV export into importable books. Resolves each
 * row's ISBN to an ISBN-13 (rows without one are skipped), and maps the
 * reading status, rating and review where present.
 */
export function parseBookCsv(text: string): CsvImportResult {
  const rows = parseCsvRows(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length < 2) return { books: [], skipped: 0 };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]): number => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iIsbn13 = col('isbn13', 'isbn-13');
  const iIsbn = col('isbn', 'isbn10', 'isbn-10');
  const iRating = col('my rating', 'note', 'rating', 'ma note');
  const iShelf = col('exclusive shelf', 'statut', 'status', 'étagère exclusive', 'shelf');
  const iReview = col('my review', 'critique', 'review', 'commentaire', 'avis');

  const at = (row: string[], i: number): string => (i >= 0 && i < row.length ? row[i] : '');

  const byIsbn = new Map<string, ImportedBook>();
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const isbn13 = toIsbn13(at(row, iIsbn13)) ?? toIsbn13(at(row, iIsbn));
    if (!isbn13) {
      skipped++;
      continue;
    }
    if (byIsbn.has(isbn13)) continue; // de-dupe within the file
    const review = at(row, iReview).trim();
    byIsbn.set(isbn13, {
      isbn13,
      rating: iRating >= 0 ? mapRating(at(row, iRating)) : null,
      status: iShelf >= 0 ? mapStatus(at(row, iShelf)) : null,
      notes: review || null,
    });
  }

  return { books: [...byIsbn.values()], skipped };
}
