/**
 * Forgiving reading-date parsing (pure — unit-tested in reading-date.test.ts).
 * Lets a user date a book read years ago without fighting a strict format.
 */

const ZERO = (n: number) => String(n).padStart(2, '0');

/** True if y-m-d form a real calendar day (rejects e.g. 30 Feb). */
function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Forgiving date parse → canonical `YYYY-MM-DD`, or null if unparseable.
 * Accepts ISO (`2019-06-28`), French (`28/06/2019`, `28-06-2019`, `28.06.2019`),
 * a month+year (`06/2019` → `2019-06-01`) and a bare year (`2019` → `2019-01-01`)
 * so you can date a book read years ago even without the exact day.
 */
export function parseFlexibleDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let y: number, m: number, d: number;

  let mt = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); // ISO
  if (mt) {
    y = +mt[1];
    m = +mt[2];
    d = +mt[3];
  } else if ((mt = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) {
    // FR day/month/year
    d = +mt[1];
    m = +mt[2];
    y = +mt[3];
  } else if ((mt = s.match(/^(\d{1,2})[/.-](\d{4})$/))) {
    // month/year → 1st of month
    d = 1;
    m = +mt[1];
    y = +mt[2];
  } else if ((mt = s.match(/^(\d{4})$/))) {
    // bare year → 1 Jan
    d = 1;
    m = 1;
    y = +mt[1];
  } else {
    return null;
  }

  if (!isRealDate(y, m, d)) return null;
  return `${y}-${ZERO(m)}-${ZERO(d)}`;
}
