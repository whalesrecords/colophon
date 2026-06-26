import { toLibraryCsv } from './export-csv';
import type { LibraryItem } from './use-library';

function item(over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    id: '1',
    status: 'read',
    rating: 4,
    added_at: '2026-06-26T10:00:00Z',
    cover_override: null,
    book: {
      isbn13: '9782266190329',
      title: 'Test',
      authors: ['A. Auteur'],
      publisher: 'Pocket',
      language: 'fr',
      published_date: '2010',
      cover_url: null,
      genres: [],
    },
    shelfNames: ['SF'],
    tagNames: ['favori'],
    lentTo: null,
    ...over,
  } as LibraryItem;
}

describe('toLibraryCsv', () => {
  it('emits a header plus one row per item', () => {
    const lines = toLibraryCsv([item()]).split('\n');
    expect(lines[0]).toContain('Titre');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('9782266190329');
    expect(lines[1]).toContain('Lu'); // status mapped to French
    expect(lines[1]).toContain('2026-06-26'); // added_at trimmed to date
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    const messy = item({ book: { ...item().book, title: 'Hello, "World"' } as LibraryItem['book'] });
    expect(toLibraryCsv([messy])).toContain('"Hello, ""World"""');
  });

  it('joins authors, shelves and tags with semicolons', () => {
    const csv = toLibraryCsv([item({ shelfNames: ['SF', 'BD'], tagNames: ['a', 'b'] })]);
    expect(csv).toContain('SF; BD');
    expect(csv).toContain('a; b');
  });

  it('handles an empty library (header only)', () => {
    expect(toLibraryCsv([]).split('\n')).toHaveLength(1);
  });
});
