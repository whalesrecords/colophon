import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BookSearchResult } from '@/lib/book-search-parsers';
import { parseSeries, seriesKey } from '@/lib/series';
import { supabase } from '@/lib/supabase';

export interface SeriesVolume {
  isbn13: string;
  title: string;
  volume: number;
  coverUrl: string | null;
}

/**
 * Assemble a series' volume list by searching the series title and keeping the
 * results that belong to the same series (via the Tome/Vol heuristic), one per
 * volume number, ordered. Reuses the merged Google+Open Library book-search.
 */
export function useSeriesVolumes() {
  return useMutation({
    mutationFn: async (seriesName: string): Promise<SeriesVolume[]> => {
      const { data, error } = await supabase.functions.invoke('book-search', {
        body: { title: seriesName },
      });
      if (error) throw new Error('Recherche impossible. Réessayez.');
      const results = ((data as { results?: BookSearchResult[] } | null)?.results ?? []);
      const key = seriesKey(seriesName);

      const byVolume = new Map<number, SeriesVolume>();
      for (const r of results) {
        const ref = parseSeries(r.title);
        if (!ref) continue;
        const rk = seriesKey(ref.name);
        // Lenient: tolerate edition suffixes ("Gantz :E", "Gantz Omnibus") by
        // matching when one series key is a prefix of the other.
        if (!(rk === key || rk.startsWith(key) || key.startsWith(rk))) continue;
        if (!byVolume.has(ref.volume)) {
          byVolume.set(ref.volume, {
            isbn13: r.isbn13,
            title: r.title ?? '',
            volume: ref.volume,
            coverUrl: r.coverUrl,
          });
        }
      }
      const result = [...byVolume.values()].sort((a, b) => a.volume - b.volume);
      // Cache the series total (best-effort) for at-a-glance "X/Y" library badges.
      if (result.length > 0) {
        void supabase.from('series').upsert(
          {
            normalized_key: key,
            name: seriesName,
            total_volumes: result.length,
            source: 'book-search',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'normalized_key' },
        );
      }
      return result;
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
