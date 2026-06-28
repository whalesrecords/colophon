import { parseFlexibleDate } from './reading-date';

describe('parseFlexibleDate', () => {
  it('accepts ISO', () => {
    expect(parseFlexibleDate('2019-06-28')).toBe('2019-06-28');
    expect(parseFlexibleDate('2019-6-8')).toBe('2019-06-08');
  });

  it('accepts French day/month/year with / . -', () => {
    expect(parseFlexibleDate('28/06/2019')).toBe('2019-06-28');
    expect(parseFlexibleDate('28.06.2019')).toBe('2019-06-28');
    expect(parseFlexibleDate('28-06-2019')).toBe('2019-06-28');
    expect(parseFlexibleDate('5/3/2019')).toBe('2019-03-05');
  });

  it('accepts month/year → 1st of month', () => {
    expect(parseFlexibleDate('06/2019')).toBe('2019-06-01');
  });

  it('accepts a bare year → 1 Jan', () => {
    expect(parseFlexibleDate('2019')).toBe('2019-01-01');
  });

  it('trims surrounding whitespace', () => {
    expect(parseFlexibleDate('  2019-06-28  ')).toBe('2019-06-28');
  });

  it('rejects impossible calendar days', () => {
    expect(parseFlexibleDate('30/02/2019')).toBeNull();
    expect(parseFlexibleDate('2019-13-01')).toBeNull();
    expect(parseFlexibleDate('00/06/2019')).toBeNull();
  });

  it('rejects empty and garbage', () => {
    expect(parseFlexibleDate('')).toBeNull();
    expect(parseFlexibleDate('   ')).toBeNull();
    expect(parseFlexibleDate('hier')).toBeNull();
    expect(parseFlexibleDate('06/19')).toBeNull();
  });
});
