import { useQuery } from '@tanstack/react-query';

import { groupBySeries } from '@/features/library/group-series';
import { useLibrary } from '@/features/library/use-library';
import { parseSeries, seriesKey } from '@/lib/series';

import { fetchSeriesResults, type SeriesVolume, volumesFromResults } from './use-series-volumes';

/** Cap how many series we hit the search API for on one refresh (kindness to the API). */
const MAX_SERIES = 16;

export interface UpcomingItem {
  seriesName: string;
  key: string;
  volume: SeriesVolume;
}

export interface UpcomingResult {
  scannedSeries: number;
  skippedSeries: number;
  /** Volumes with a publication date in the future — the release calendar. */
  upcoming: UpcomingItem[];
  /** Interior gaps in numbered series you already own ("il manque T7, T12"). */
  missing: UpcomingItem[];
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

/**
 * "À venir" — across the user's owned series, surface (a) volumes whose release
 * date is still in the future (a real release calendar) and (b) interior gaps in
 * numbered series they own. Runs the deep book-search per series, so it's gated
 * behind an explicit screen open and cached for 30 min.
 */
export function useUpcoming(userId: string | undefined) {
  const { data: items } = useLibrary(userId);

  const owned = (items ?? []).filter((i) => i.ownership === 'owned');
  const { groups } = groupBySeries(owned);
  // Most-invested series first; cap the fan-out.
  const ranked = [...groups].sort((a, b) => b.distinctCount - a.distinctCount);
  const scan = ranked.slice(0, MAX_SERIES);
  const signature = scan.map((g) => `${g.key}:${g.distinctCount}`).join('|');

  return useQuery({
    queryKey: ['upcoming', userId, signature],
    enabled: !!userId && !!items,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<UpcomingResult> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
          const isOwned = ownedIsbns.has(v.isbn13) || ownedNumbers.has(v.volume);
          if (isOwned) continue;
          const pub = parsePub(v.publishedDate);
          const isFuture = pub != null && pub.getTime() > today.getTime();
          if (isFuture) {
            upcoming.push({ seriesName: g.name, key: g.key, volume: v });
          } else if (ownedNumbers.size > 0 && v.volume <= maxOwned) {
            // Only flag interior gaps for series whose owned items carry tome
            // numbers — otherwise "missing" is guesswork (bare-title series).
            missing.push({ seriesName: g.name, key: g.key, volume: v });
          }
        }
        return { upcoming, missing };
      });

      const upcoming = perSeries
        .flatMap((p) => p.upcoming)
        .sort((a, b) => {
          const da = parsePub(a.volume.publishedDate)?.getTime() ?? Infinity;
          const db = parsePub(b.volume.publishedDate)?.getTime() ?? Infinity;
          return da - db;
        });
      const missing = perSeries
        .flatMap((p) => p.missing)
        .sort((a, b) => a.seriesName.localeCompare(b.seriesName) || a.volume.volume - b.volume.volume);

      return {
        scannedSeries: scan.length,
        skippedSeries: Math.max(0, ranked.length - scan.length),
        upcoming,
        missing,
      };
    },
  });
}
