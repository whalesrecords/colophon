import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Add a physical copy to the current user's library. The book_metadata row for
 * `isbn13` must already exist (the isbn-lookup function upserts it first).
 */
export function useAddItem(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isbn13: string): Promise<{ id: string }> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { data, error } = await supabase
        .from('items')
        .insert({ isbn13, user_id: userId })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
