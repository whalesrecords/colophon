import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Ownership, ReadingStatus } from '@/theme/tokens';

export interface AddItemInput {
  isbn13: string;
  ownership?: Ownership;
  status?: ReadingStatus;
  borrowedFrom?: string | null;
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
      const { isbn13, ownership, status, borrowedFrom } = input;
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
      // Note: adding a book as "Lu" sets the status only — it does NOT fabricate a
      // dated finish (the book may have been read years ago). The "Lu" pill on the
      // book detail (useMarkRead) is the explicit "I finished it now" gesture.
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}
