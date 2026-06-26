import { useMutation } from '@tanstack/react-query';

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
      return [...byVolume.values()].sort((a, b) => a.volume - b.volume);
    },
  });
}
