import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface TasteCluster {
  label: string;
  percent: number;
}

export interface TasteRec {
  title: string;
  author: string;
  isbn13: string;
  cover_url: string;
  universe: string;
  why: string;
  match: number;
  related: string[];
}

export interface CommunityRating {
  avg: number | null;
  count: number;
}

/** Average rating + count across all Colophon readers for a book (by ISBN). */
export function useCommunityRating(isbn13: string | undefined) {
  return useQuery({
    queryKey: ['community-rating', isbn13],
    enabled: !!isbn13,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<CommunityRating> => {
      const { data, error } = await supabase.rpc('book_community_rating', {
        p_isbn13: isbn13 as string,
      });
      if (error) throw error;
      const row = (data ?? [])[0];
      return { avg: row?.avg ?? null, count: row?.count ?? 0 };
    },
  });
}

export interface ReaderTaste {
  clusters: TasteCluster[];
  recommendations: TasteRec[];
}

/**
 * Semantic reader profile + "Dans ton style" recommendations, computed by the
 * `reader-taste` edge function (Claude → clusters + new-series recos in FR editions,
 * cached server-side). Returns empty until the ANTHROPIC_API_KEY secret is set.
 */
export function useReaderTaste(userId: string | undefined) {
  return useQuery({
    queryKey: ['reader-taste', userId],
    enabled: !!userId,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
    queryFn: async (): Promise<ReaderTaste> => {
      const { data, error } = await supabase.functions.invoke('reader-taste', { body: {} });
      if (error) throw error;
      const d = data as Partial<ReaderTaste> | null;
      return { clusters: d?.clusters ?? [], recommendations: d?.recommendations ?? [] };
    },
  });
}
