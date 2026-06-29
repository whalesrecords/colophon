import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type GoalType = 'pages' | 'books';

export interface Challenge {
  id: string;
  circle_id: string;
  created_by: string;
  title: string;
  goal_type: GoalType;
  target: number;
  starts_on: string;
  ends_on: string;
}

export interface ChallengeWithMe extends Challenge {
  participant_count: number;
  joined: boolean;
}

export interface ChallengeProgressRow {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
  value: number;
}

/** Active + upcoming challenges in a circle, with my membership + headcount. */
export function useCircleChallenges(circleId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['challenges', circleId, userId],
    enabled: !!circleId,
    queryFn: async (): Promise<ChallengeWithMe[]> => {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, circle_id, created_by, title, goal_type, target, starts_on, ends_on')
        .eq('circle_id', circleId as string)
        .gte('ends_on', new Date().toISOString().slice(0, 10))
        .order('ends_on', { ascending: true });
      if (error) throw error;
      const list = (challenges ?? []) as Challenge[];
      if (list.length === 0) return [];

      const ids = list.map((c) => c.id);
      const { data: parts } = await supabase
        .from('challenge_participants')
        .select('challenge_id, user_id')
        .in('challenge_id', ids);
      const countById = new Map<string, number>();
      const minePerChallenge = new Set<string>();
      for (const p of parts ?? []) {
        countById.set(p.challenge_id, (countById.get(p.challenge_id) ?? 0) + 1);
        if (p.user_id === userId) minePerChallenge.add(p.challenge_id);
      }
      return list.map((c) => ({
        ...c,
        participant_count: countById.get(c.id) ?? 0,
        joined: minePerChallenge.has(c.id),
      }));
    },
  });
}

/** Live ranking of a challenge's participants toward its target. */
export function useChallengeProgress(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenge-progress', challengeId],
    enabled: !!challengeId,
    staleTime: 30_000,
    queryFn: async (): Promise<ChallengeProgressRow[]> => {
      const { data, error } = await supabase.rpc('challenge_progress', {
        p_challenge: challengeId as string,
      });
      if (error) throw error;
      return (data ?? []) as ChallengeProgressRow[];
    },
  });
}

export function useChallengeActions(circleId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['challenges', circleId, userId] });

  const create = useMutation({
    mutationFn: async (input: {
      title: string;
      goalType: GoalType;
      target: number;
      endsOn: string;
    }): Promise<void> => {
      if (!circleId || !userId) throw new Error('Vous devez être connecté.');
      const { data: row, error } = await supabase
        .from('challenges')
        .insert({
          circle_id: circleId,
          created_by: userId,
          title: input.title,
          goal_type: input.goalType,
          target: input.target,
          ends_on: input.endsOn,
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      // The creator joins automatically.
      const { error: jErr } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: row.id, user_id: userId });
      if (jErr) throw new Error(jErr.message);
    },
    onSuccess: invalidate,
  });

  const join = useMutation({
    mutationFn: async (challengeId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: async (challengeId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { create, join, leave };
}
