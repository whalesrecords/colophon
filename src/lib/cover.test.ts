import { normalizeCover, openLibraryCover } from './cover';

describe('normalizeCover', () => {
  it('forces default=false on Open Library covers so missing ones 404', () => {
    expect(normalizeCover('https://covers.openlibrary.org/b/isbn/9782070360024-L.jpg')).toBe(
      'https://covers.openlibrary.org/b/isbn/9782070360024-L.jpg?default=false',
    );
  });

  it('keeps an existing query and appends default=false', () => {
    expect(normalizeCover('https://covers.openlibrary.org/b/id/123-L.jpg?foo=1')).toBe(
      'https://covers.openlibrary.org/b/id/123-L.jpg?foo=1&default=false',
    );
  });

  it('does not double-add default when already present', () => {
    const url = 'https://covers.openlibrary.org/b/isbn/9782070360024-L.jpg?default=false';
    expect(normalizeCover(url)).toBe(url);
  });

  it('upgrades http to https and leaves non-OL covers otherwise untouched', () => {
    expect(normalizeCover('http://books.google.com/books/content?id=x&zoom=1')).toBe(
      'https://books.google.com/books/content?id=x&zoom=1',
    );
  });

  it('falls back to the Open Library ISBN cover when no url but an ISBN-13', () => {
    expect(normalizeCover(null, '9782070360024')).toBe(openLibraryCover('9782070360024', 'L'));
  });

  it('returns null when there is nothing to try', () => {
    expect(normalizeCover(null)).toBeNull();
    expect(normalizeCover('', 'not-an-isbn')).toBeNull();
  });
});
