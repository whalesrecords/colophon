import { parseIsbnList } from './isbn-list';

describe('parseIsbnList', () => {
  it('extracts valid ISBNs from newline / comma / space separated text', () => {
    const text = `9782070360024
978-2-203-00123-7, 2266190326
not-an-isbn 0000000000000`;
    expect(parseIsbnList(text)).toEqual([
      '9782070360024',
      '9782203001237',
      '9782266190329', // ISBN-10 2266190326 -> ISBN-13
    ]);
  });

  it('de-duplicates (incl. ISBN-10 / ISBN-13 of the same book)', () => {
    expect(parseIsbnList('9782070360024 9782070360024 2070360024')).toEqual(['9782070360024']);
  });

  it('returns an empty array when there is nothing valid', () => {
    expect(parseIsbnList('hello, world 123')).toEqual([]);
    expect(parseIsbnList('')).toEqual([]);
  });
});
