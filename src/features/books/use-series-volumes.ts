import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BookSearchResult } from '@/lib/book-search-parsers';
import { parseSeries, seriesKey } from '@/lib/series';
import { supabase } from '@/lib/supabase';

export interface SeriesVolume {
  isbn13: string;
  title: string;
  volume: number;
  coverUrl: string | null;
  publishedDate: string | null;
}

/** Run the deep book-search for a series title and return the raw results. */
export async function fetchSeriesResults(seriesName: string): Promise<BookSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('book-search', {
    body: { title: seriesName, deep: true },
  });
  if (error) throw new Error('Recherche impossible. Réessayez.');
  return (data as { results?: BookSearchResult[] } | null)?.results ?? [];
}

/**
 * Keep the search results that belong to the same series (via the Tome/Vol
 * heuristic), one per volume number, ordered. Exact series-key match only — a
 * lenient prefix match wrongly pulled spin-offs in (e.g. "Naruto Gaiden").
 */
export function volumesFromResults(
  results: BookSearchResult[],
  seriesName: string,
): SeriesVolume[] {
  const key = seriesKey(seriesName);
  const byVolume = new Map<number, SeriesVolume>();
  for (const r of results) {
    const ref = parseSeries(r.title);
    if (!ref || seriesKey(ref.name) !== key) continue;
    if (!byVolume.has(ref.volume)) {
      byVolume.set(ref.volume, {
        isbn13: r.isbn13,
        title: r.title ?? '',
        volume: ref.volume,
        coverUrl: r.coverUrl,
        publishedDate: r.publishedDate,
      });
    }
  }
  return [...byVolume.values()].sort((a, b) => a.volume - b.volume);
}

/**
 * Assemble a series' volume list by searching the series title. Reuses the
 * merged Google + Open Library book-search.
 */
export function useSeriesVolumes() {
  return useMutation({
    mutationFn: async (seriesName: string): Promise<SeriesVolume[]> => {
      // NB: we do NOT cache result.length as the series total — book-search rarely
      // returns the full run (Berserk found 28/42), so a search-derived count would
      // be a wrong, world-shared "X/Y". The total comes from the per-user override
      // (useSetSeriesTotal) or a curated seed instead.
      return volumesFromResults(await fetchSeriesResults(seriesName), seriesName);
    },
  });
}

/** Cached series total-volume counts, keyed by normalized series key. */
export function useSeriesTotals(userId: string | undefined) {
  return useQuery({
    queryKey: ['series-totals', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, number>> => {
      const [shared, mine] = await Promise.all([
        supabase.from('series').select('normalized_key, total_volumes'),
        supabase.from('user_series_totals').select('normalized_key, total_volumes'),
      ]);
      if (shared.error) throw shared.error;
      const totals = new Map<string, number>();
      for (const row of shared.data ?? []) {
        if (row.total_volumes != null) totals.set(row.normalized_key, row.total_volumes);
      }
      // A per-user override (e.g. a special edition's count) wins over the shared cache.
      for (const row of mine.data ?? []) {
        if (row.total_volumes != null) totals.set(row.normalized_key, row.total_volumes);
      }
      return totals;
    },
  });
}

/** Set a per-user override for a series' total volume count (null clears it). */
export function useSetSeriesTotal(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, total }: { key: string; total: number | null }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase.from('user_series_totals').upsert(
        {
          user_id: userId,
          normalized_key: key,
          total_volumes: total,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,normalized_key' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['series-totals', userId] }),
  });
}
