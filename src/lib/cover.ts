/**
 * Cover-URL normalization shared by every place that renders a BookCover.
 *
 * Two real-world problems this fixes:
 *  1. Open Library cover URLs without `default=false` return a 1×1 blank image
 *     (HTTP 200) when no cover exists — so the <Image> "succeeds" and shows a
 *     blank grey box instead of falling back to our composed cover. Forcing
 *     `default=false` makes a missing cover 404, which triggers the fallback.
 *  2. Books with no stored cover at all still have an ISBN — we can try the
 *     Open Library cover-by-ISBN endpoint as a last resort.
 */

const OL_COVERS_HOST = 'covers.openlibrary.org';

/** Open Library cover-by-ISBN URL that 404s (not a blank) when missing. */
export function openLibraryCover(isbn13: string, size: 'M' | 'L' = 'L'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn13}-${size}.jpg?default=false`;
}

/**
 * Resolve the best cover URL to attempt for a book. Returns null when there is
 * nothing to try (the caller then renders the composed cover).
 */
export function normalizeCover(
  coverUrl: string | null | undefined,
  isbn13?: string | null,
): string | null {
  const raw = coverUrl?.trim();
  if (raw) {
    let url = raw.startsWith('http://') ? `https://${raw.slice('http://'.length)}` : raw;
    if (url.includes(OL_COVERS_HOST) && !url.includes('default=')) {
      url += (url.includes('?') ? '&' : '?') + 'default=false';
    }
    return url;
  }
  if (isbn13 && /^\d{13}$/.test(isbn13)) return openLibraryCover(isbn13, 'L');
  return null;
}
