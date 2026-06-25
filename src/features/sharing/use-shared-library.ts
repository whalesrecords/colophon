import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface SharedBook {
  isbn13: string;
  title: string | null;
  authors: string[] | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
}

export interface SharedItem {
  status: string;
  book: SharedBook | null;
}

export interface SharedLibrary {
  scope: 'library' | 'shelf';
  shelfName: string | null;
  count: number;
  items: SharedItem[];
}

/** Fetch a public shared library/shelf by token (no auth required). */
export function useSharedLibrary(token: string | undefined) {
  return useQuery({
    queryKey: ['shared', token],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<SharedLibrary> => {
      const { data, error } = await supabase.functions.invoke('shared-library', {
        body: { token },
      });
      if (error) throw new Error('Lien de partage invalide ou expiré.');
      return data as SharedLibrary;
    },
  });
}
