import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface Tag {
  id: string;
  name: string;
}

export function useTags(userId: string | undefined) {
  return useQuery({
    queryKey: ['tags', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase.from('tags').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTagActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = (itemId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['tags', userId] });
    queryClient.invalidateQueries({ queryKey: ['library'] });
    if (itemId) queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
  };

  const createTag = useMutation({
    mutationFn: async (name: string): Promise<Tag> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { data, error } = await supabase
        .from('tags')
        .insert({ user_id: userId, name: name.trim() })
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(),
  });

  const addTag = useMutation({
    mutationFn: async ({ itemId, tagId }: { itemId: string; tagId: string }): Promise<void> => {
      const { error } = await supabase.from('item_tags').insert({ item_id: itemId, tag_id: tagId });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => invalidate(vars.itemId),
  });

  const removeTag = useMutation({
    mutationFn: async ({ itemId, tagId }: { itemId: string; tagId: string }): Promise<void> => {
      const { error } = await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', itemId)
        .eq('tag_id', tagId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => invalidate(vars.itemId),
  });

  return { createTag, deleteTag, addTag, removeTag };
}
