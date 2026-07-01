import { env } from '@/lib/env';

function buyQuery(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  return isbn13?.trim() || [title, author].filter(Boolean).join(' ').trim();
}

/**
 * leslibraires.fr — the cooperative of ~1200 independent French bookshops (pick a
 * local shop at checkout). Links to the book page (with the affiliate id when set,
 * cf. docs/affiliation.md) when we have an ISBN, else a title/author search.
 */
export function bookshopUrl(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  const isbn = isbn13?.trim();
  if (isbn) {
    const aff = env.librairesPartner
      ? `?affiliate=${encodeURIComponent(env.librairesPartner)}`
      : '';
    return `https://www.leslibraires.fr/livre/${encodeURIComponent(isbn)}/${aff}`;
  }
  return `https://www.leslibraires.fr/recherche/?q=${encodeURIComponent(buyQuery(isbn13, title, author))}`;
}

/**
 * Amazon (FR) — offered alongside the indie option. Appends the Associates tag
 * (`env.amazonTag`) so purchases earn affiliate commission; without a tag it's a
 * plain search link. Links straight to the product page when we have an ISBN.
 */
export function amazonUrl(
  isbn13: string | null | undefined,
  title?: string | null,
  author?: string | null,
): string {
  const tag = env.amazonTag ? `tag=${encodeURIComponent(env.amazonTag)}` : '';
  const isbn = isbn13?.trim();
  // Amazon resolves /dp/<ISBN> for books → a direct, higher-converting affiliate link.
  const base = isbn
    ? `https://www.amazon.fr/dp/${encodeURIComponent(isbn)}`
    : `https://www.amazon.fr/s?k=${encodeURIComponent(buyQuery(isbn13, title, author))}`;
  if (!tag) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${tag}`;
}

/**
 * Physical independent bookshops near the reader. With coordinates, a Google Maps
 * search centred on them ("librairie indépendante" around their point); without
 * (location denied / unavailable), the leslibraires.fr co-op shop directory — the
 * honest fallback, since the app has no bookshop-location database of its own.
 */
export function indieBookshopsNearUrl(loc: { lat: number; lng: number } | null): string {
  if (loc) {
    return `https://www.google.com/maps/search/librairie+ind%C3%A9pendante/@${loc.lat},${loc.lng},14z`;
  }
  return 'https://www.leslibraires.fr/nos-librairies/';
}
