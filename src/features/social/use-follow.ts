import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface FeedEntry {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
  title: string | null;
  cover_url: string | null;
  isbn13: string | null;
  rating: number | null;
  finished_on: string;
  body: string | null;
}

/** Do I follow this reader? */
export function useIsFollowing(targetId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['following', userId, targetId],
    enabled: !!userId && !!targetId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', userId as string)
        .eq('followee_id', targetId as string)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useFollowActions(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = (target?: string) => {
    qc.invalidateQueries({ queryKey: ['following', userId] });
    qc.invalidateQueries({ queryKey: ['reading-feed', userId] });
    if (target) qc.invalidateQueries({ queryKey: ['following', userId, target] });
  };

  const follow = useMutation({
    mutationFn: async (target: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: userId, followee_id: target });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, t) => invalidate(t),
  });

  const unfollow = useMutation({
    mutationFn: async (target: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('followee_id', target);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, t) => invalidate(t),
  });

  return { follow, unfollow };
}

/** Books recently finished by the people I follow. */
export function useReadingFeed(userId: string | undefined) {
  return useQuery({
    queryKey: ['reading-feed', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<FeedEntry[]> => {
      const { data, error } = await supabase.rpc('reading_feed');
      if (error) throw error;
      return (data ?? []) as FeedEntry[];
    },
  });
}
