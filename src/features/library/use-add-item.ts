import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Ownership, ReadingStatus } from '@/theme/tokens';

export interface AddItemInput {
  isbn13: string;
  ownership?: Ownership;
  status?: ReadingStatus;
  borrowedFrom?: string | null;
  /** When adding as "Lu" from the AddSheet: the year it was read (defaults handled by caller). */
  readYear?: number | null;
  /** Total pages — recorded on the finished session so "Lu" counts the whole book. */
  pageCount?: number | null;
}

/**
 * Add a copy to the current user's library with its possession + reading status.
 * The book_metadata row for `isbn13` must already exist (isbn-lookup upserts it).
 */
export function useAddItem(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddItemInput): Promise<{ id: string }> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { isbn13, ownership, status, borrowedFrom, readYear, pageCount } = input;
      const { data, error } = await supabase
        .from('items')
        .insert({
          isbn13,
          user_id: userId,
          ...(ownership ? { ownership } : {}),
          ...(status ? { status } : {}),
          ...(borrowedFrom != null ? { borrowed_from: borrowedFrom } : {}),
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      // Adding as "Lu" with a year (from the AddSheet) records a finished session dated
      // to that year, with the FULL page count — so a read book counts its whole pages
      // and shows up in "Lus en {year}". Bulk paths pass no readYear → status-only (no
      // fabricated date), preserving the "read years ago" safety.
      if (status === 'read' && readYear != null) {
        const date = `${readYear}-01-01`;
        await supabase.from('reading_sessions').insert({
          item_id: data.id,
          status: 'finished',
          started_on: date,
          finished_on: date,
          total_pages: pageCount ?? null,
          current_page: pageCount ?? null,
        });
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}
