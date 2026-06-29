import { useQuery } from '@tanstack/react-query';

import type { BookSearchResult } from '@/lib/book-search-parsers';
import { rankSearchResults } from '@/lib/rank-search';
import { supabase } from '@/lib/supabase';

interface OwnedRow {
  isbn13: string | null;
  book: { authors: string[] | null } | null;
}

/**
 * "Dans ton style" — up to 5 books to discover, based on the authors the reader
 * already owns (most-frequent first), excluding what's already in their library.
 * Pulled from the book-search edge function (Open Library). Heavily cached: it
 * fans out a few searches, so we keep it fresh for an hour.
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
        .select('isbn13, book:book_metadata(authors)')
        .eq('user_id', userId as string)
        .neq('ownership', 'wishlist');
      if (error) throw error;

      const owned = new Set<string>();
      const authorCount = new Map<string, number>();
      for (const r of (rows ?? []) as unknown as OwnedRow[]) {
        if (r.isbn13) owned.add(r.isbn13);
        for (const a of r.book?.authors ?? []) {
          const key = a.trim();
          if (key) authorCount.set(key, (authorCount.get(key) ?? 0) + 1);
        }
      }
      const topAuthors = [...authorCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([a]) => a);
      if (topAuthors.length === 0) return [];

      // Spread across authors (max 2 each) so the row feels varied rather than
      // "here are 5 more volumes of the one series you collect".
      const PER_AUTHOR = 2;
      const seen = new Set<string>();
      const recs: BookSearchResult[] = [];
      for (const author of topAuthors) {
        if (recs.length >= 5) break;
        const { data } = await supabase.functions.invoke('book-search', { body: { author } });
        const results = rankSearchResults(
          (data as { results?: BookSearchResult[] } | null)?.results ?? [],
        );
        let taken = 0;
        for (const b of results) {
          if (recs.length >= 5 || taken >= PER_AUTHOR) break;
          if (!b.isbn13 || !b.title || !b.coverUrl) continue;
          if (owned.has(b.isbn13) || seen.has(b.isbn13)) continue;
          seen.add(b.isbn13);
          recs.push(b);
          taken += 1;
        }
      }
      return recs;
    },
  });
}
