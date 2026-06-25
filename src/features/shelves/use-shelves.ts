import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface Shelf {
  id: string;
  name: string;
}

export function useShelves(userId: string | undefined) {
  return useQuery({
    queryKey: ['shelves', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Shelf[]> => {
      const { data, error } = await supabase.from('shelves').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useShelfActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = (itemId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['shelves', userId] });
    queryClient.invalidateQueries({ queryKey: ['library'] });
    if (itemId) queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
  };

  const createShelf = useMutation({
    mutationFn: async (name: string): Promise<Shelf> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { data, error } = await supabase
        .from('shelves')
        .insert({ user_id: userId, name: name.trim() })
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const deleteShelf = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('shelves').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(),
  });

  const addToShelf = useMutation({
    mutationFn: async ({ itemId, shelfId }: { itemId: string; shelfId: string }): Promise<void> => {
      const { error } = await supabase
        .from('item_shelves')
        .insert({ item_id: itemId, shelf_id: shelfId });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => invalidate(vars.itemId),
  });

  const removeFromShelf = useMutation({
    mutationFn: async ({ itemId, shelfId }: { itemId: string; shelfId: string }): Promise<void> => {
      const { error } = await supabase
        .from('item_shelves')
        .delete()
        .eq('item_id', itemId)
        .eq('shelf_id', shelfId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => invalidate(vars.itemId),
  });

  return { createShelf, deleteShelf, addToShelf, removeFromShelf };
}
