function buyQuery(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  return isbn13?.trim() || [title, author].filter(Boolean).join(' ').trim();
}

/**
 * leslibraires.fr — the cooperative of ~1200 independent French bookshops (pick a
 * local shop at checkout). Searches by ISBN when available, else title + author.
 */
export function bookshopUrl(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  return `https://www.leslibraires.fr/recherche/?q=${encodeURIComponent(buyQuery(isbn13, title, author))}`;
}

/** Amazon (FR) search — offered alongside the indie option. */
export function amazonUrl(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(buyQuery(isbn13, title, author))}`;
}
