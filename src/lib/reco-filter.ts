import { parseSeries, seriesKey } from './series';

/**
 * Collapse a book title to an edition/volume/language-insensitive "work key":
 * lowercase, strip accents, drop volume/edition words + all non-letters. So
 * "Berserk - Tome 09", "Berserk (Chaos Edition)" and "Berserk" all map to "berserk".
 */
export function normalizeWork(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(
      /\b(tome|tomes|volume|vol|edition|deluxe|perfect|chaos|collector|integrale|coffret|t)\b/g,
      ' ',
    )
    .replace(/[^a-z]+/g, '');
}

function normAuthor(a: string): string {
  return a
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '');
}

/** Length of the longest common substring of a and b (cheap for short titles). */
function longestCommonSubstring(a: string, b: string): number {
  if (!a || !b) return 0;
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagPrev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      if (a[i - 1] === b[j - 1]) {
        prev[j] = diagPrev + 1;
        if (prev[j] > best) best = prev[j];
      } else {
        prev[j] = 0;
      }
      diagPrev = tmp;
    }
  }
  return best;
}

export interface LibraryRef {
  title: string | null;
  author: string | null;
}

/**
 * Drop recommendations the reader already owns or wants — even in a different edition,
 * volume, or language. Matches by work key + series key (catches "Fire Punch", another
 * "Berserk" edition, a wishlisted "Blame!"), plus a same-author fuzzy pass that catches
 * cross-language titles ("Good Night Punpun" ⇄ "Bonne nuit Pun Pun", both Inio Asano).
 */
export function excludeOwnedRecs<T extends { title: string; author?: string }>(
  recs: T[],
  library: LibraryRef[],
): T[] {
  const works = new Set<string>();
  const seriesKeys = new Set<string>();
  const titlesByAuthor = new Map<string, string[]>();
  for (const it of library) {
    if (!it.title) continue;
    const work = normalizeWork(it.title);
    if (work) works.add(work);
    const p = parseSeries(it.title);
    seriesKeys.add(seriesKey(p?.name ?? it.title));
    if (it.author) {
      const a = normAuthor(it.author);
      if (a) (titlesByAuthor.get(a) ?? titlesByAuthor.set(a, []).get(a)!).push(work);
    }
  }

  return recs.filter((r) => {
    const work = normalizeWork(r.title);
    if (work && works.has(work)) return false;
    const p = parseSeries(r.title);
    if (seriesKeys.has(seriesKey(p?.name ?? r.title))) return false;
    // Same-author cross-language / re-title: a shared distinctive run (≥5 chars).
    const a = r.author ? normAuthor(r.author) : '';
    if (a && titlesByAuthor.has(a)) {
      for (const owned of titlesByAuthor.get(a)!) {
        if (work.length >= 5 && owned.length >= 5 && longestCommonSubstring(work, owned) >= 5) {
          return false;
        }
      }
    }
    return true;
  });
}
