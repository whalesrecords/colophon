import { applyFilters, computeFacets, EMPTY_FILTERS, type Filters, sortItems } from './faceting';
import type { LibraryItem } from './use-library';

function makeItem(
  id: string,
  status: LibraryItem['status'],
  book: Partial<NonNullable<LibraryItem['book']>>,
): LibraryItem {
  return {
    id,
    status,
    rating: null,
    added_at: '2026-01-01',
    shelfNames: [],
    book: {
      isbn13: id,
      title: null,
      authors: null,
      publisher: null,
      language: null,
      published_date: null,
      cover_url: null,
      genres: null,
      ...book,
    },
  };
}

const items: LibraryItem[] = [
  makeItem('a', 'read', {
    title: "L'Étranger",
    authors: ['Albert Camus'],
    publisher: 'Gallimard',
    language: 'fr',
    published_date: '1942',
    genres: ['Fiction', 'Roman'],
  }),
  makeItem('b', 'to_read', {
    title: 'Les Villes invisibles',
    authors: ['Italo Calvino'],
    publisher: 'Seuil',
    language: 'it',
    published_date: '1972',
    genres: ['Fiction'],
  }),
  makeItem('c', 'read', {
    title: "L'Usage du monde",
    authors: ['Nicolas Bouvier'],
    publisher: 'Gallimard',
    language: 'fr',
    published_date: '1963',
    genres: ['Essai'],
  }),
];

function withFacet(key: keyof Filters['facets'], values: string[]): Filters {
  return { ...EMPTY_FILTERS, facets: { ...EMPTY_FILTERS.facets, [key]: values } };
}

describe('applyFilters', () => {
  it('filters by a facet (OR within facet)', () => {
    expect(applyFilters(items, withFacet('genre', ['Fiction'])).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('combines facets with AND', () => {
    const f: Filters = {
      ...EMPTY_FILTERS,
      facets: { ...EMPTY_FILTERS.facets, genre: ['Fiction'], status: ['read'] },
    };
    expect(applyFilters(items, f).map((i) => i.id)).toEqual(['a']);
  });

  it('searches title/author/isbn/publisher', () => {
    expect(applyFilters(items, { ...EMPTY_FILTERS, search: 'calvino' }).map((i) => i.id)).toEqual(['b']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, search: 'gallimard' }).map((i) => i.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('computeFacets (funnel counts)', () => {
  it('counts a facet ignoring its own selection but honoring others', () => {
    const facets = computeFacets(items, withFacet('status', ['read']));
    // status counts ignore the status filter itself:
    expect(facets.status).toEqual([
      { value: 'read', count: 2 },
      { value: 'to_read', count: 1 },
    ]);
    // genre counts are narrowed to the "read" subset (a, c):
    const genres = Object.fromEntries(facets.genre.map((g) => [g.value, g.count]));
    expect(genres).toEqual({ Essai: 1, Fiction: 1, Roman: 1 });
  });
});

describe('sortItems', () => {
  it('sorts by title and by year', () => {
    expect(sortItems(items, 'title').map((i) => i.book?.title)).toEqual([
      "L'Étranger",
      "L'Usage du monde",
      'Les Villes invisibles',
    ]);
    expect(sortItems(items, 'year').map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
});
