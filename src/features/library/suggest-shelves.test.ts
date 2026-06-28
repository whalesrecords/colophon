import { suggestShelves } from './suggest-shelves';
import type { LibraryItem } from './use-library';

function item(id: string, book: Partial<NonNullable<LibraryItem['book']>>): LibraryItem {
  return {
    id,
    status: 'to_read',
    ownership: 'owned',
    format: null,
    borrowedFrom: null,
    rating: null,
    added_at: '2026-01-01',
    coverOverride: null,
    shelfNames: [],
    tagNames: [],
    lentTo: null,
    book: {
      isbn13: id,
      title: id,
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

describe('suggestShelves', () => {
  const items: LibraryItem[] = [
    item('1', { publisher: 'Gallimard', authors: ['Camus'] }),
    item('2', { publisher: 'Gallimard', authors: ['Camus'] }),
    item('3', { publisher: 'Gallimard', authors: ['Camus'] }),
    item('4', { publisher: 'Gallimard', authors: ['Sartre'] }),
    item('5', { publisher: 'Seuil' }),
  ];

  it('suggests a shelf for a cluster of >= 4 books, not for smaller ones', () => {
    const s = suggestShelves(items, []);
    const gallimard = s.find((x) => x.label === 'Gallimard');
    expect(gallimard?.count).toBe(4);
    expect(gallimard?.itemIds.sort()).toEqual(['1', '2', '3', '4']);
    // Camus = 3 books, Seuil = 1 -> below threshold, not suggested
    expect(s.find((x) => x.label === 'Camus')).toBeUndefined();
    expect(s.find((x) => x.label === 'Seuil')).toBeUndefined();
  });

  it('does not re-suggest a shelf that already exists', () => {
    expect(
      suggestShelves(items, ['gallimard']).find((x) => x.label === 'Gallimard'),
    ).toBeUndefined();
  });

  it('labels decades and languages nicely', () => {
    const fr = Array.from({ length: 4 }, (_, i) =>
      item(`l${i}`, { language: 'ja', published_date: '1995' }),
    );
    const s = suggestShelves(fr, []);
    expect(s.find((x) => x.label === 'Japonais')).toBeTruthy();
    expect(s.find((x) => x.label === 'Années 1990')).toBeTruthy();
  });
});
