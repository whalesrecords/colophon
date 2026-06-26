import { groupBySeries } from './group-series';
import type { LibraryItem } from './use-library';

function item(id: string, title: string): LibraryItem {
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
      title,
      authors: null,
      publisher: null,
      language: null,
      published_date: null,
      cover_url: null,
      genres: null,
    },
  };
}

describe('groupBySeries', () => {
  it('stacks 2+ owned volumes of the same series and leaves the rest single', () => {
    const items = [
      item('a', 'One Piece - Tome 3'),
      item('b', 'One Piece - Tome 1'),
      item('c', "L'Étranger"),
      item('d', 'One Piece, tome 2'),
      item('e', 'Akira Vol. 1'), // only one volume -> not a stack
    ];
    const { groups, singles } = groupBySeries(items);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('One Piece');
    expect(groups[0].count).toBe(3);
    // sorted by volume; cover is the lowest volume (tome 1 = 'b')
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'd', 'a']);
    expect(groups[0].cover.id).toBe('b');

    // L'Étranger + the single Akira volume stay as standalone books
    expect(singles.map((i) => i.id).sort()).toEqual(['c', 'e']);
  });
});
