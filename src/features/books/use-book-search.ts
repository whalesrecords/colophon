import { useMutation } from '@tanstack/react-query';

import type { BookSearchResult } from '@/lib/book-search-parsers';
import { rankSearchResults } from '@/lib/rank-search';
import { supabase } from '@/lib/supabase';

export type { BookSearchResult };

export interface BookSearchParams {
  q?: string;
  title?: string;
  author?: string;
  publisher?: string;
  subject?: string;
}

/** Free-text / fielded book search via the book-search edge function. */
export function useBookSearch() {
  return useMutation({
    mutationFn: async (params: BookSearchParams): Promise<BookSearchResult[]> => {
      const { data, error } = await supabase.functions.invoke('book-search', { body: params });
      if (error) throw new Error('Recherche impossible. Vérifiez votre connexion.');
      return rankSearchResults((data as { results?: BookSearchResult[] } | null)?.results ?? []);
    },
  });
}
