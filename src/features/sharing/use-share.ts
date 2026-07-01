import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export interface Share {
  id: string;
  token: string;
  scope: 'library' | 'shelf';
  shelf_id: string | null;
}

/** Public URL for a share token (the canonical deployed domain — opened by others,
 *  so never the sharer's localhost/preview origin). */
export function shareUrl(token: string): string {
  return `${env.webUrl.replace(/\/$/, '')}/s/${token}`;
}

export function useShares(userId: string | undefined) {
  return useQuery({
    queryKey: ['shares-list', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Share[]> => {
      const { data, error } = await supabase
        .from('shares')
        .select('id, token, scope, shelf_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Share[];
    },
  });
}

export function useCreateShare(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scope: 'library' | 'shelf'; shelfId?: string }): Promise<Share> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { data, error } = await supabase
        .from('shares')
        .insert({ user_id: userId, scope: input.scope, shelf_id: input.shelfId ?? null })
        .select('id, token, scope, shelf_id')
        .single();
      if (error) throw new Error(error.message);
      return data as Share;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares-list', userId] }),
  });
}
