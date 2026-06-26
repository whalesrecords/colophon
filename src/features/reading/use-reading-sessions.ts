import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useReadingSessions(itemId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<ReadingSession[]> => {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('item_id', itemId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSessionActions(itemId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions', itemId] });
    queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
    queryClient.invalidateQueries({ queryKey: ['library'] });
    queryClient.invalidateQueries({ queryKey: ['stats', userId] });
  };

  const start = useMutation({
    mutationFn: async (totalPages: number | null): Promise<void> => {
      const { error } = await supabase.from('reading_sessions').insert({
        item_id: itemId,
        status: 'reading',
        started_on: today(),
        total_pages: totalPages,
        current_page: 0,
      });
      if (error) throw new Error(error.message);
      await supabase.from('items').update({ status: 'reading' }).eq('id', itemId);
    },
    onSuccess: invalidate,
  });

  const setPage = useMutation({
    mutationFn: async ({ sessionId, page }: { sessionId: string; page: number }): Promise<void> => {
      const { error } = await supabase
        .from('reading_sessions')
        .update({ current_page: Math.max(0, page) })
        .eq('id', sessionId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const finish = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      const { error } = await supabase
        .from('reading_sessions')
        .update({ status: 'finished', finished_on: today() })
        .eq('id', sessionId);
      if (error) throw new Error(error.message);
      await supabase.from('items').update({ status: 'read' }).eq('id', itemId);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      const { error } = await supabase.from('reading_sessions').delete().eq('id', sessionId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { start, setPage, finish, remove };
}

/**
 * Mark a book read via the status pill: set items.status='read' AND record a
 * finished reading session dated today, so it counts in "Lus en {year}". A book
 * that already has a finished session this year is not double-counted.
 */
export function useMarkRead(itemId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error: upd } = await supabase
        .from('items')
        .update({ status: 'read' })
        .eq('id', itemId);
      if (upd) throw new Error(upd.message);

      const year = String(new Date().getFullYear());
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('finished_on, status')
        .eq('item_id', itemId)
        .eq('status', 'finished');
      const alreadyThisYear = (sessions ?? []).some((s) => s.finished_on?.startsWith(year));
      if (!alreadyThisYear) {
        const { error } = await supabase.from('reading_sessions').insert({
          item_id: itemId,
          status: 'finished',
          started_on: today(),
          finished_on: today(),
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', itemId] });
      queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}
