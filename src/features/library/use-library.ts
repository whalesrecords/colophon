import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ReadingStatus } from '@/theme/tokens';

export interface LibraryBook {
  isbn13: string;
  title: string | null;
  authors: string[] | null;
  publisher: string | null;
  language: string | null;
  published_date: string | null;
  cover_url: string | null;
  genres: string[] | null;
}

export interface LibraryItem {
  id: string;
  status: ReadingStatus;
  rating: number | null;
  added_at: string;
  book: LibraryBook | null;
}

const SELECT =
  'id, status, rating, added_at, book:book_metadata(isbn13, title, authors, publisher, language, published_date, cover_url, genres)';

/** The current user's library: items newest-first, joined with book metadata. */
export function useLibrary(userId: string | undefined) {
  return useQuery({
    queryKey: ['library', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LibraryItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select(SELECT)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LibraryItem[];
    },
  });
}
