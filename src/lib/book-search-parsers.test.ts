import { parseGoogleBooksSearch, parseOpenLibrarySearch } from './book-search-parsers';

describe('parseGoogleBooksSearch', () => {
  it('keeps only candidates with an ISBN-13 and cleans the cover', () => {
    const res = parseGoogleBooksSearch({
      totalItems: 2,
      items: [
        {
          volumeInfo: {
            title: 'Les Villes invisibles',
            authors: ['Italo Calvino'],
            publisher: 'Seuil',
            publishedDate: '1996',
            imageLinks: {
              thumbnail: 'http://books.google.com/books/content?id=A&img=1&zoom=1&edge=curl',
            },
            industryIdentifiers: [{ type: 'ISBN_13', identifier: '9782020238052' }],
          },
        },
        { volumeInfo: { title: 'Sans ISBN', authors: ['X'] } },
      ],
    });
    expect(res).toEqual([
      {
        isbn13: '9782020238052',
        title: 'Les Villes invisibles',
        subtitle: null,
        authors: ['Italo Calvino'],
        publisher: 'Seuil',
        publishedDate: '1996',
        coverUrl: 'https://books.google.com/books/content?id=A&img=1&zoom=1',
      },
    ]);
  });

  it('derives ISBN-13 from ISBN-10 and dedupes', () => {
    const res = parseGoogleBooksSearch({
      items: [
        { volumeInfo: { title: 'A', industryIdentifiers: [{ type: 'ISBN_10', identifier: '2070360024' }] } },
        { volumeInfo: { title: 'A again', industryIdentifiers: [{ type: 'ISBN_13', identifier: '9782070360024' }] } },
      ],
    });
    expect(res).toHaveLength(1);
    expect(res[0].isbn13).toBe('9782070360024');
  });

  it('returns [] for empty input', () => {
    expect(parseGoogleBooksSearch({})).toEqual([]);
    expect(parseGoogleBooksSearch({ items: [] })).toEqual([]);
  });
});

describe('parseOpenLibrarySearch', () => {
  it('maps docs to ISBN-13 candidates with a cover URL', () => {
    const res = parseOpenLibrarySearch({
      docs: [
        {
          title: 'Désert',
          author_name: ['J. M. G. Le Clézio'],
          publisher: ['Gallimard'],
          first_publish_year: 1980,
          isbn: ['2070372707', '9782070372706'],
        },
        { title: 'No ISBN', author_name: ['X'], isbn: [] },
      ],
    });
    expect(res).toEqual([
      {
        isbn13: '9782070372706',
        title: 'Désert',
        subtitle: null,
        authors: ['J. M. G. Le Clézio'],
        publisher: 'Gallimard',
        publishedDate: '1980',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9782070372706-M.jpg',
      },
    ]);
  });

  it('returns [] when there are no docs', () => {
    expect(parseOpenLibrarySearch({})).toEqual([]);
  });
});
