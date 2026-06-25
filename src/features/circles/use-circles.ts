import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

export interface CircleSummary {
  id: string;
  name: string;
  invite_code: string;
  memberCount: number;
}

export interface Circle {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
}

export interface CircleMember {
  user_id: string;
  display_name: string | null;
  joined_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export function useCircles(userId: string | undefined) {
  return useQuery({
    queryKey: ['circles', userId],
    enabled: !!userId,
    queryFn: async (): Promise<CircleSummary[]> => {
      const { data, error } = await supabase
        .from('circles')
        .select('id, name, invite_code, created_at, members:circle_members(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        invite_code: c.invite_code,
        memberCount: (c.members as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));
    },
  });
}

export function useCircle(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<Circle> => {
      const { data, error } = await supabase
        .from('circles')
        .select('id, name, invite_code, owner_id')
        .eq('id', circleId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCircleMembers(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle-members', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CircleMember[]> => {
      const { data, error } = await supabase
        .from('circle_members')
        .select('user_id, display_name, joined_at')
        .eq('circle_id', circleId as string)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCircle(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Circle> => {
      const { data, error } = await supabase.rpc('create_circle', { p_name: name.trim() });
      if (error) throw new Error(error.message);
      return data as unknown as Circle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circles', userId] }),
  });
}

export function useJoinCircle(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<Circle> => {
      const { data, error } = await supabase.rpc('join_circle', { p_code: code.trim() });
      if (error) {
        throw new Error(
          error.message.includes('circle_not_found')
            ? 'Code de cercle introuvable.'
            : error.message,
        );
      }
      return data as unknown as Circle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circles', userId] }),
  });
}

export function useLeaveCircle(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleId: string): Promise<void> => {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', userId as string);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circles', userId] }),
  });
}

export function useSendMessage(circleId: string, userId: string | undefined) {
  return useMutation({
    mutationFn: async (body: string): Promise<void> => {
      const text = body.trim();
      if (!text || !userId) return;
      const { error } = await supabase
        .from('messages')
        .insert({ circle_id: circleId, user_id: userId, body: text });
      if (error) throw new Error(error.message);
    },
  });
}

/** Messages for a circle, kept live via a realtime subscription. */
export function useCircleMessages(circleId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, user_id, body, created_at')
        .eq('circle_id', circleId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!circleId) return;
    const channel = supabase
      .channel(`messages:${circleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `circle_id=eq.${circleId}` },
        (payload) => {
          const row = payload.new as Message;
          queryClient.setQueryData<Message[]>(['messages', circleId], (old) => {
            if (!old) return [row];
            if (old.some((m) => m.id === row.id)) return old;
            return [...old, row];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, queryClient]);

  return query;
}

export interface CircleEvent {
  id: string;
  circle_id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  created_at: string;
}

export function useCircleEvents(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle-events', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CircleEvent[]> => {
      const { data, error } = await supabase
        .from('circle_events')
        .select('*')
        .eq('circle_id', circleId as string)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEventActions(circleId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] });

  const createEvent = useMutation({
    mutationFn: async (input: {
      title: string;
      startsAt: string;
      location?: string;
      description?: string;
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const title = input.title.trim();
      if (!title) throw new Error('Donnez un titre au rendez-vous.');
      const when = new Date(input.startsAt);
      if (Number.isNaN(when.getTime())) throw new Error('Date ou heure invalide.');
      const { error } = await supabase.from('circle_events').insert({
        circle_id: circleId,
        created_by: userId,
        title,
        starts_at: when.toISOString(),
        location: input.location?.trim() || null,
        description: input.description?.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      const { error } = await supabase.from('circle_events').delete().eq('id', eventId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { createEvent, deleteEvent };
}
