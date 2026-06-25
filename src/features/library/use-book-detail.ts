import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ItemRow = Database['public']['Tables']['items']['Row'];
export type BookMetadata = Database['public']['Tables']['book_metadata']['Row'];

export interface BookDetail extends ItemRow {
  book: BookMetadata | null;
  shelfIds: string[];
}

interface RawDetail extends ItemRow {
  book: BookMetadata | null;
  item_shelves: { shelf_id: string }[] | null;
}

/** The current user's item by id, joined with its book metadata + shelf ids. */
export function useBookDetail(itemId: string | undefined) {
  return useQuery({
    queryKey: ['book-detail', itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<BookDetail> => {
      const { data, error } = await supabase
        .from('items')
        .select('*, book:book_metadata(*), item_shelves(shelf_id)')
        .eq('id', itemId as string)
        .single();
      if (error) throw error;
      const raw = data as unknown as RawDetail;
      const { item_shelves, ...rest } = raw;
      return { ...rest, shelfIds: (item_shelves ?? []).map((s) => s.shelf_id) };
    },
  });
}
