import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const DEFAULT_DAILY_GOAL = 20;

export interface DailyGoal {
  /** Pages/day target (defaults to 20 until the user sets their own). */
  goal: number;
  /** Pages read today. */
  today: number;
  /** Consecutive days meeting the goal (one grace day allowed). */
  streak: number;
  /** Whether the user has explicitly set a goal. */
  goalSet: boolean;
  /** Pages read per day, keyed by ISO date (yyyy-mm-dd) — for the month view. */
  byDay: Record<string, number>;
  /** Minutes read today (the chronometer rollup). */
  minutesToday: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Streak = consecutive days meeting the goal, ending today or yesterday (today is
 * still "in progress" so not hitting it yet doesn't break the run). One grace day
 * is forgiven so a single miss doesn't wipe months — the dossier's anti-shame rule.
 */
function computeStreak(byDay: Map<string, number>, goal: number): number {
  const met = (d: Date) => (byDay.get(iso(d)) ?? 0) >= goal;
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  if (!met(day)) day.setDate(day.getDate() - 1); // don't penalise an in-progress today
  let streak = 0;
  let grace = 1;
  for (let i = 0; i < 400; i++) {
    if (met(day)) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    } else if (grace > 0) {
      grace -= 1;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useDailyGoal(userId: string | undefined) {
  return useQuery({
    queryKey: ['daily-goal', userId],
    enabled: !!userId,
    queryFn: async (): Promise<DailyGoal> => {
      const [{ data: profile }, { data: rows }] = await Promise.all([
        supabase
          .from('profiles')
          .select('daily_goal')
          .eq('user_id', userId as string)
          .maybeSingle(),
        supabase
          .from('daily_reading')
          .select('day, pages, minutes')
          .order('day', { ascending: false })
          .limit(400), // a full year of days for the "12 cercles" view
      ]);
      const goalSet = profile?.daily_goal != null;
      const goal = profile?.daily_goal ?? DEFAULT_DAILY_GOAL;
      const byDay = new Map<string, number>();
      const minutesByDay = new Map<string, number>();
      for (const r of rows ?? []) {
        byDay.set(r.day, r.pages);
        minutesByDay.set(r.day, r.minutes ?? 0);
      }
      const todayIso = iso(new Date());
      return {
        goal,
        today: byDay.get(todayIso) ?? 0,
        streak: computeStreak(byDay, goal),
        goalSet,
        byDay: Object.fromEntries(byDay),
        minutesToday: minutesByDay.get(todayIso) ?? 0,
      };
    },
  });
}

export function useSetDailyGoal(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: number | null): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, daily_goal: goal, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-goal', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
