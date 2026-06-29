import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface LeaderRow {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
  pages: number;
}

/** Weekly pages ranking among me + my friends (last 7 days). */
export function useFriendsLeaderboard(userId: string | undefined) {
  return useQuery({
    queryKey: ['friends-leaderboard', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await supabase.rpc('friends_leaderboard');
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}

/** Weekly pages ranking for a circle's members (members only). */
export function useCircleLeaderboard(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle-leaderboard', circleId],
    enabled: !!circleId,
    staleTime: 60_000,
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await supabase.rpc('circle_leaderboard', {
        p_circle: circleId as string,
      });
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}
