import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export interface Share {
  id: string;
  token: string;
  scope: 'library' | 'shelf';
  shelf_id: string | null;
}

/** Public URL for a share token (points at the web app). */
export function shareUrl(token: string): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_URL;
  const base =
    fromEnv ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://colophon.app');
  return `${base.replace(/\/$/, '')}/s/${token}`;
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
