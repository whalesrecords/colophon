import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ItemRow = Database['public']['Tables']['items']['Row'];
export type BookMetadata = Database['public']['Tables']['book_metadata']['Row'];

export interface BookDetail extends ItemRow {
  book: BookMetadata | null;
}

/** The current user's item by id, joined with its book metadata. */
export function useBookDetail(itemId: string | undefined) {
  return useQuery({
    queryKey: ['book-detail', itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<BookDetail> => {
      const { data, error } = await supabase
        .from('items')
        .select('*, book:book_metadata(*)')
        .eq('id', itemId as string)
        .single();
      if (error) throw error;
      return data as unknown as BookDetail;
    },
  });
}
