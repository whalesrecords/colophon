import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface CoverCandidate {
  url: string;
  source: string;
}

/** Deep cover search across Google / Open Library / BnF / AniList, validated. */
export function useCoverSearch() {
  return useMutation({
    mutationFn: async (input: {
      isbn13?: string;
      title?: string;
      author?: string;
    }): Promise<CoverCandidate[]> => {
      const { data, error } = await supabase.functions.invoke('cover-search', { body: input });
      if (error) throw new Error('Recherche impossible. Réessayez.');
      return (data as { candidates?: CoverCandidate[] } | null)?.candidates ?? [];
    },
  });
}
