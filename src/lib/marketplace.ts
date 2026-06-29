/**
 * Resale / donation links for a book — the counterpart to bookshop.ts (which is
 * for buying). momox gives an instant buyback price *by condition* when you enter
 * the ISBN (the v1 answer to "prix approximatif selon l'état"); Vinted & Leboncoin
 * are P2P marketplaces where a title search surfaces comparable listings (the going
 * rate) and where you can list to sell — or give away (Leboncoin "donnons", a free
 * Vinted listing). No public APIs, so these are deep links, like the buy links.
 */

function comps(title?: string | null, author?: string | null, isbn?: string | null): string {
  return [title, author].filter(Boolean).join(' ').trim() || isbn?.trim() || '';
}

/** momox — rachat instantané: you enter the ISBN and get a price by condition. */
export function momoxSellUrl(): string {
  return 'https://www.momox.fr/vendre-livres/';
}

/** Vinted FR — list to sell, or browse comparable listings to gauge the rate. */
export function vintedUrl(
  isbn?: string | null,
  title?: string | null,
  author?: string | null,
): string {
  return `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(comps(title, author, isbn))}`;
}

/** Leboncoin — sell or give away locally ("donnons"); text search shows comps. */
export function leboncoinUrl(
  isbn?: string | null,
  title?: string | null,
  author?: string | null,
): string {
  return `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(comps(title, author, isbn))}`;
}
