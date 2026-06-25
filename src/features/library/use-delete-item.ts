import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Delete an item from the library. FK cascades remove its shelves, tags and
 * reading sessions; shared book_metadata is untouched.
 */
export function useDeleteItem(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}

/** How many copies of an ISBN the current user owns (for duplicate notices). */
export function useCopyCount(isbn13: string | undefined) {
  return useQuery({
    queryKey: ['copies', isbn13],
    enabled: !!isbn13,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('isbn13', isbn13 as string);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
