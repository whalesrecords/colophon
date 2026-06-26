import { parseBookCsv, parseCsvRows } from './book-csv';

describe('parseCsvRows', () => {
  it('handles quoted fields with commas and escaped quotes', () => {
    const rows = parseCsvRows('a,"b, c","d""e"\n1,2,3');
    expect(rows[0]).toEqual(['a', 'b, c', 'd"e']);
    expect(rows[1]).toEqual(['1', '2', '3']);
  });
});

describe('parseBookCsv — Goodreads', () => {
  const csv = [
    'Title,Author,ISBN,ISBN13,My Rating,Exclusive Shelf,My Review',
    'L\'Étranger,Albert Camus,="2070360024",="9782070360024",4,read,"Un classique, vraiment."',
    'To Read Book,Someone,="",="9782070douze",0,to-read,',
    'Naruto,Kishimoto,="",="9782505011163",5,currently-reading,',
  ].join('\n');

  it('maps isbn13, rating, status and review', () => {
    const { books, skipped } = parseBookCsv(csv);
    const camus = books.find((b) => b.isbn13 === '9782070360024');
    expect(camus).toEqual({
      isbn13: '9782070360024',
      rating: 4,
      status: 'read',
      notes: 'Un classique, vraiment.',
    });
    const naruto = books.find((b) => b.isbn13 === '9782505011163');
    expect(naruto?.status).toBe('reading');
    expect(naruto?.rating).toBe(5);
    // the malformed-ISBN row is skipped
    expect(skipped).toBe(1);
    expect(books).toHaveLength(2);
  });

  it('treats a 0 rating as unrated', () => {
    const { books } = parseBookCsv(
      'ISBN13,My Rating\n="9782070360024",0',
    );
    expect(books[0].rating).toBeNull();
  });
});

describe('parseBookCsv — Babelio (French headers)', () => {
  it('maps Titre/ISBN/Note/Statut', () => {
    const csv = 'Titre,Auteur,ISBN,Note,Statut\nSapiens,Harari,9782226257017,3,Lu';
    const { books } = parseBookCsv(csv);
    expect(books[0]).toMatchObject({ isbn13: '9782226257017', rating: 3, status: 'read' });
  });
});

describe('parseBookCsv — edge cases', () => {
  it('returns nothing for an empty or header-only file', () => {
    expect(parseBookCsv('').books).toHaveLength(0);
    expect(parseBookCsv('Title,ISBN13').books).toHaveLength(0);
  });

  it('de-dupes repeated ISBNs within the file', () => {
    const csv = 'ISBN13\n="9782070360024"\n="9782070360024"';
    expect(parseBookCsv(csv).books).toHaveLength(1);
  });
});
