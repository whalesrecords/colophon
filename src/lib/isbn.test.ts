import {
  cleanIsbnInput,
  computeIsbn10CheckDigit,
  computeIsbn13CheckDigit,
  isbn10To13,
  isbn13To10,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn,
  toIsbn13,
} from './isbn';

describe('cleanIsbnInput', () => {
  it('strips spaces and hyphens and uppercases X', () => {
    expect(cleanIsbnInput('978-2-07-036002-4')).toBe('9782070360024');
    expect(cleanIsbnInput('  2070360024 ')).toBe('2070360024');
    expect(cleanIsbnInput('080442957x')).toBe('080442957X');
  });
});

describe('check digits', () => {
  it('computes the ISBN-13 check digit', () => {
    expect(computeIsbn13CheckDigit('978207036002')).toBe('4');
    expect(computeIsbn13CheckDigit('978080442957')).toBe('3');
  });

  it('computes the ISBN-10 check digit, including X', () => {
    expect(computeIsbn10CheckDigit('207036002')).toBe('4');
    expect(computeIsbn10CheckDigit('080442957')).toBe('X');
  });
});

describe('validation', () => {
  it('accepts valid ISBN-13s', () => {
    expect(isValidIsbn13('9782070360024')).toBe(true);
    expect(isValidIsbn13('9780804429573')).toBe(true);
  });

  it('rejects ISBN-13s with a bad check digit or wrong shape', () => {
    expect(isValidIsbn13('9782070360025')).toBe(false);
    expect(isValidIsbn13('978207036002')).toBe(false);
    expect(isValidIsbn13('97820703600ab')).toBe(false);
  });

  it('accepts valid ISBN-10s, including an X check digit', () => {
    expect(isValidIsbn10('2070360024')).toBe(true);
    expect(isValidIsbn10('080442957X')).toBe(true);
  });

  it('rejects ISBN-10s with a bad check digit', () => {
    expect(isValidIsbn10('2070360025')).toBe(false);
  });
});

describe('conversion', () => {
  it('converts ISBN-10 to ISBN-13', () => {
    expect(isbn10To13('2070360024')).toBe('9782070360024');
    expect(isbn10To13('080442957X')).toBe('9780804429573');
  });

  it('converts 978-prefixed ISBN-13 back to ISBN-10', () => {
    expect(isbn13To10('9782070360024')).toBe('2070360024');
  });

  it('returns null when converting a 979-prefixed ISBN-13 to ISBN-10', () => {
    expect(isbn13To10('9791234567896')).toBeNull();
  });
});

describe('normalizeIsbn', () => {
  it('normalizes a formatted ISBN-13 to canonical form', () => {
    expect(normalizeIsbn('978-2-07-036002-4')).toEqual({
      ok: true,
      isbn13: '9782070360024',
      isbn10: '2070360024',
    });
  });

  it('promotes an ISBN-10 to ISBN-13', () => {
    expect(normalizeIsbn('2070360024')).toEqual({
      ok: true,
      isbn13: '9782070360024',
      isbn10: '2070360024',
    });
  });

  it('keeps isbn10 null for a 979-prefixed ISBN-13', () => {
    expect(normalizeIsbn('9791234567896')).toEqual({
      ok: true,
      isbn13: '9791234567896',
      isbn10: null,
    });
  });

  it('rejects empty, malformed, and invalid input', () => {
    expect(normalizeIsbn('')).toEqual({ ok: false, error: 'empty' });
    expect(normalizeIsbn('   ')).toEqual({ ok: false, error: 'empty' });
    expect(normalizeIsbn('12345')).toEqual({ ok: false, error: 'bad_length' });
    expect(normalizeIsbn('9782070360025')).toEqual({ ok: false, error: 'bad_check_digit' });
    expect(normalizeIsbn('2070360025')).toEqual({ ok: false, error: 'bad_check_digit' });
    expect(normalizeIsbn('9771234567890')).toEqual({ ok: false, error: 'bad_prefix' });
    expect(normalizeIsbn('978207036002A')).toEqual({ ok: false, error: 'bad_characters' });
  });
});

describe('toIsbn13', () => {
  it('returns the canonical ISBN-13 or null', () => {
    expect(toIsbn13('2070360024')).toBe('9782070360024');
    expect(toIsbn13('nope')).toBeNull();
  });
});
