import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ItemUpdate = Database['public']['Tables']['items']['Update'];

/**
 * Patch one of the current user's items (status, rating, notes, location,
 * condition, purchase…). RLS guarantees only the owner can update.
 */
export function useUpdateItem(itemId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ItemUpdate): Promise<void> => {
      const { error } = await supabase.from('items').update(patch).eq('id', itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}
