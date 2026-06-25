import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface TrendEntry {
  label: string;
  count: number;
}

export interface CommunityTrends {
  genres: TrendEntry[];
  authors: TrendEntry[];
  tags: TrendEntry[];
  readers: number;
  books: number;
}

/** Aggregate, privacy-safe trends across every library. */
export function useTrends() {
  return useQuery({
    queryKey: ['trends'],
    queryFn: async (): Promise<CommunityTrends> => {
      const { data, error } = await supabase.rpc('community_trends');
      if (error) throw error;
      return data as unknown as CommunityTrends;
    },
  });
}
