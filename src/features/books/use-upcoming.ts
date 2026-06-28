import { useQuery } from '@tanstack/react-query';

import { groupBySeries } from '@/features/library/group-series';
import { useLibrary } from '@/features/library/use-library';
import type { BookSearchResult } from '@/lib/book-search-parsers';
import { parseSeries, seriesKey } from '@/lib/series';
import { supabase } from '@/lib/supabase';

import { fetchSeriesResults, type SeriesVolume, volumesFromResults } from './use-series-volumes';

/** Cap how many series / authors we hit the search API for on one refresh. */
const MAX_SERIES = 16;
const MAX_AUTHORS = 3;

export interface UpcomingItem {
  seriesName: string;
  key: string;
  volume: SeriesVolume;
}

export interface AuthorBook {
  author: string;
  isbn13: string;
  title: string;
  coverUrl: string | null;
  publishedDate: string | null;
}

export interface UpcomingResult {
  scannedSeries: number;
  skippedSeries: number;
  /** SERIES volumes with a publication date still in the future — the true calendar. */
  upcoming: UpcomingItem[];
  /** Interior gaps in numbered series you own — already published, to complete. */
  missing: UpcomingItem[];
  /** Books by your favourite authors that you don't own (newest first). */
  fromAuthors: AuthorBook[];
  /** The favourite authors that were scanned. */
  authors: string[];
}

/** Parse a loose published date ("2026", "2026-09", "2026-09-15") to a Date. */
function parsePub(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 1900 || y > 3000) return null;
  return new Date(y, m[2] ? Number(m[2]) - 1 : 0, m[3] ? Number(m[3]) : 1);
}

/** Run `fn` over `items` with a bounded concurrency. */
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function fetchAuthorResults(author: string): Promise<BookSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('book-search', { body: { author } });
  if (error) return [];
  return (data as { results?: BookSearchResult[] } | null)?.results ?? [];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * "À venir" — across the user's owned series AND favourite authors, surface:
 * (a) future-dated series volumes (the genuine release calendar, often sparse —
 * open catalogues don't carry many forthcoming dates), (b) interior gaps to
 * complete numbered series (already published), and (c) books by favourite
 * authors not yet owned. Runs the book-search per series/author, so it's gated
 * behind an explicit screen open and cached for 30 min.
 */
export function useUpcoming(userId: string | undefined) {
  const { data: items } = useLibrary(userId);

  const owned = (items ?? []).filter((i) => i.ownership === 'owned');
  const { groups } = groupBySeries(owned);
  const ranked = [...groups].sort((a, b) => b.distinctCount - a.distinctCount);
  const scan = ranked.slice(0, MAX_SERIES);

  // Favourite authors: those with 2+ owned books, most-owned first.
  const authorCount = new Map<string, number>();
  for (const it of owned) {
    for (const a of it.book?.authors ?? []) authorCount.set(a, (authorCount.get(a) ?? 0) + 1);
  }
  const topAuthors = [...authorCount.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_AUTHORS)
    .map(([a]) => a);

  const signature =
    scan.map((g) => `${g.key}:${g.distinctCount}`).join('|') + '#' + topAuthors.join(',');

  return useQuery({
    queryKey: ['upcoming', userId, signature],
    enabled: !!userId && !!items,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<UpcomingResult> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ownedIsbnsAll = new Set(
        owned.map((i) => i.book?.isbn13).filter((x): x is string => !!x),
      );

      const perSeries = await pool(scan, 4, async (g) => {
        const ownedNumbers = new Set<number>();
        const ownedIsbns = new Set<string>();
        for (const it of g.items) {
          if (it.book?.isbn13) ownedIsbns.add(it.book.isbn13);
          const ref = parseSeries(it.book?.title);
          if (ref) ownedNumbers.add(ref.volume);
        }
        const maxOwned = ownedNumbers.size ? Math.max(...ownedNumbers) : 0;

        let volumes: SeriesVolume[] = [];
        try {
          volumes = volumesFromResults(await fetchSeriesResults(g.name), g.name);
        } catch {
          return { upcoming: [], missing: [] as UpcomingItem[] };
        }

        const upcoming: UpcomingItem[] = [];
        const missing: UpcomingItem[] = [];
        for (const v of volumes) {
          if (ownedIsbns.has(v.isbn13) || ownedNumbers.has(v.volume)) continue;
          const pub = parsePub(v.publishedDate);
          if (pub != null && pub.getTime() > today.getTime()) {
            upcoming.push({ seriesName: g.name, key: g.key, volume: v });
          } else if (ownedNumbers.size > 0 && v.volume <= maxOwned) {
            missing.push({ seriesName: g.name, key: g.key, volume: v });
          }
        }
        return { upcoming, missing };
      });

      // Favourite authors → books not owned, by that author, newest first.
      const perAuthor = await pool(topAuthors, 3, async (author) => {
        let res: BookSearchResult[] = [];
        try {
          res = await fetchAuthorResults(author);
        } catch {
          return [] as AuthorBook[];
        }
        const seen = new Set<string>();
        const out: AuthorBook[] = [];
        for (const r of res) {
          if (!r.isbn13 || ownedIsbnsAll.has(r.isbn13) || seen.has(r.isbn13)) continue;
          const byThisAuthor = (r.authors ?? []).some(
            (a) => norm(a).includes(norm(author)) || norm(author).includes(norm(a)),
          );
          if (!byThisAuthor) continue;
          seen.add(r.isbn13);
          out.push({
            author,
            isbn13: r.isbn13,
            title: r.title ?? '',
            coverUrl: r.coverUrl,
            publishedDate: r.publishedDate,
          });
        }
        return out;
      });

      const upcoming = perSeries
        .flatMap((p) => p.upcoming)
        .sort(
          (a, b) =>
            (parsePub(a.volume.publishedDate)?.getTime() ?? Infinity) -
            (parsePub(b.volume.publishedDate)?.getTime() ?? Infinity),
        );
      const missing = perSeries
        .flatMap((p) => p.missing)
        .sort(
          (a, b) => a.seriesName.localeCompare(b.seriesName) || a.volume.volume - b.volume.volume,
        );

      // Dedupe author books across authors, newest publication first, capped.
      const authorSeen = new Set<string>();
      const fromAuthors = perAuthor
        .flat()
        .filter((b) => (authorSeen.has(b.isbn13) ? false : (authorSeen.add(b.isbn13), true)))
        .sort(
          (a, b) =>
            (parsePub(b.publishedDate)?.getTime() ?? 0) -
            (parsePub(a.publishedDate)?.getTime() ?? 0),
        )
        .slice(0, 15);

      return {
        scannedSeries: scan.length,
        skippedSeries: Math.max(0, ranked.length - scan.length),
        upcoming,
        missing,
        fromAuthors,
        authors: topAuthors,
      };
    },
  });
}
