import { useQuery } from '@tanstack/react-query';

import type { BookSearchResult } from '@/lib/book-search-parsers';
import { rankSearchResults } from '@/lib/rank-search';
import { parseSeries } from '@/lib/series';
import { supabase } from '@/lib/supabase';

interface OwnedRow {
  isbn13: string | null;
  book: { authors: string[] | null; genres: string[] | null; title: string | null } | null;
}

function seriesKey(title: string | null | undefined): string {
  if (!title) return '';
  const name = parseSeries(title)?.name ?? title;
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function topN(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/**
 * "Dans ton style" — up to 5 books to DISCOVER (not owned), in the same vein as the
 * reader's library. We search book-search by the reader's top genres + authors, then
 * exclude anything they already own AND any series they already collect (so you don't
 * get "5 more volumes of Berserk"), and keep one book per series for variety.
 * Heavily cached (fans out a few searches).
 */
export function useRecommendations(userId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', userId],
    enabled: !!userId,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    queryFn: async (): Promise<BookSearchResult[]> => {
      const { data: rows, error } = await supabase
        .from('items')
        .select('isbn13, book:book_metadata(authors, genres, title)')
        .eq('user_id', userId as string)
        .neq('ownership', 'wishlist');
      if (error) throw error;

      const ownedIsbns = new Set<string>();
      const ownedSeries = new Set<string>();
      const genreCount = new Map<string, number>();
      const authorCount = new Map<string, number>();
      for (const r of (rows ?? []) as unknown as OwnedRow[]) {
        if (r.isbn13) ownedIsbns.add(r.isbn13);
        const sk = seriesKey(r.book?.title);
        if (sk) ownedSeries.add(sk);
        for (const g of r.book?.genres ?? []) {
          const k = g.trim();
          if (k) genreCount.set(k, (genreCount.get(k) ?? 0) + 1);
        }
        for (const a of r.book?.authors ?? []) {
          const k = a.trim();
          if (k) authorCount.set(k, (authorCount.get(k) ?? 0) + 1);
        }
      }

      // Genres first (broadest "same vein" net), then authors (new series by them).
      const queries: { subject?: string; author?: string }[] = [
        ...topN(genreCount, 4).map((g) => ({ subject: g })),
        ...topN(authorCount, 3).map((a) => ({ author: a })),
      ];
      if (queries.length === 0) return [];

      const seenSeries = new Set<string>();
      const recs: BookSearchResult[] = [];
      for (const q of queries) {
        if (recs.length >= 5) break;
        const { data } = await supabase.functions.invoke('book-search', { body: q });
        const results = rankSearchResults(
          (data as { results?: BookSearchResult[] } | null)?.results ?? [],
        );
        for (const b of results) {
          if (recs.length >= 5) break;
          if (!b.isbn13 || !b.title || !b.coverUrl) continue;
          if (ownedIsbns.has(b.isbn13)) continue;
          const sk = seriesKey(b.title);
          if (!sk || ownedSeries.has(sk) || seenSeries.has(sk)) continue; // skip owned/dupe series
          seenSeries.add(sk);
          recs.push(b);
        }
      }
      return recs;
    },
  });
}
