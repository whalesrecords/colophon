/**
 * Where to buy a book — a search on leslibraires.fr, the cooperative of ~1200
 * independent French bookshops (you pick a local shop at checkout). Never Amazon,
 * per the product ethos. Searches by ISBN when available, else title + author.
 */
export function bookshopUrl(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  const q = isbn13?.trim() || [title, author].filter(Boolean).join(' ').trim();
  return `https://www.leslibraires.fr/recherche/?q=${encodeURIComponent(q)}`;
}
