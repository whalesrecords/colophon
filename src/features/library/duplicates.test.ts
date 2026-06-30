import { copiesByIsbn, duplicateGroups, duplicateIsbns } from './duplicates';
import type { LibraryItem } from './use-library';

function item(id: string, isbn13: string | null, title = 'T'): LibraryItem {
  return {
    id,
    status: 'to_read',
    ownership: 'owned',
    format: null,
    borrowedFrom: null,
    rating: null,
    added_at: '2026-01-01',
    queuePosition: null,
    coverOverride: null,
    shelfNames: [],
    tagNames: [],
    lentTo: null,
    book: isbn13
      ? {
          isbn13,
          title,
          authors: ['Auteur'],
          publisher: null,
          language: null,
          published_date: null,
          cover_url: null,
          genres: null,
        }
      : null,
  };
}

const items: LibraryItem[] = [
  item('1', '9781111111111', 'A'),
  item('2', '9781111111111', 'A'),
  item('3', '9782222222222', 'B'),
  item('4', '9781111111111', 'A'),
  item('5', null),
];

describe('duplicate detection', () => {
  it('counts copies per ISBN', () => {
    const m = copiesByIsbn(items);
    expect(m.get('9781111111111')).toBe(3);
    expect(m.get('9782222222222')).toBe(1);
  });

  it('flags only ISBNs owned more than once', () => {
    const dup = duplicateIsbns(items);
    expect(dup.has('9781111111111')).toBe(true);
    expect(dup.has('9782222222222')).toBe(false);
    expect(dup.size).toBe(1);
  });

  it('groups duplicates with their item ids, most-copied first', () => {
    const groups = duplicateGroups(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ isbn13: '9781111111111', count: 3 });
    expect(groups[0].ids.sort()).toEqual(['1', '2', '4']);
  });

  it('ignores items without metadata', () => {
    expect(duplicateGroups([item('x', null), item('y', null)])).toEqual([]);
  });
});
