import type { BookSearchResult } from './book-search-parsers';
import { rankSearchResults } from './rank-search';

function r(isbn13: string, publisher: string | null, coverUrl: string | null): BookSearchResult {
  return {
    isbn13,
    title: isbn13,
    subtitle: null,
    authors: null,
    publisher,
    publishedDate: null,
    coverUrl,
  };
}

describe('rankSearchResults', () => {
  it('puts editions with a publisher and cover first, keeping ties stable', () => {
    const input = [
      r('1', null, null), // POD reprint
      r('2', 'Gallimard', 'http://cover/2'), // canonical
      r('3', null, 'http://cover/3'), // cover only
      r('4', 'Seuil', null), // publisher only
    ];
    expect(rankSearchResults(input).map((x) => x.isbn13)).toEqual(['2', '4', '3', '1']);
  });

  it('does not mutate the input array', () => {
    const input = [r('1', null, null), r('2', 'Gallimard', null)];
    const snapshot = input.map((x) => x.isbn13);
    rankSearchResults(input);
    expect(input.map((x) => x.isbn13)).toEqual(snapshot);
  });
});
