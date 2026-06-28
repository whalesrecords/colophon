import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

export interface CircleMemberPreview {
  user_id: string;
  display_name: string | null;
  avatar_path: string | null;
}

export interface CircleSummary {
  id: string;
  name: string;
  invite_code: string;
  memberCount: number;
  members: CircleMemberPreview[]; // for the avatar stack in the Échanges overview
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
        .select(
          'id, name, invite_code, created_at, members:circle_members(count), member_rows:circle_members(user_id, display_name, joined_at)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as {
        id: string;
        name: string;
        invite_code: string;
        members: { count: number }[] | null;
        member_rows: { user_id: string; display_name: string | null; joined_at: string }[] | null;
      }[];

      // Resolve member avatars in one batch (profiles are SELECT-able to authenticated).
      const ids = [...new Set(rows.flatMap((c) => (c.member_rows ?? []).map((m) => m.user_id)))];
      const avatarById = new Map<string, string | null>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, avatar_path')
          .in('user_id', ids);
        for (const p of profs ?? []) avatarById.set(p.user_id, p.avatar_path);
      }

      return rows.map((c) => ({
        id: c.id,
        name: c.name,
        invite_code: c.invite_code,
        memberCount: c.members?.[0]?.count ?? 0,
        members: (c.member_rows ?? [])
          .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
          .map((m) => ({
            user_id: m.user_id,
            display_name: m.display_name,
            avatar_path: avatarById.get(m.user_id) ?? null,
          })),
      }));
    },
  });
}

/**
 * Unread message counts per circle (messages newer than my last read, not mine).
 * Subscribes to message inserts so the badge updates live.
 */
export function useUnreadCounts(userId: string | undefined) {
  const queryClient = useQueryClient();
  // Unique per hook instance — this hook is mounted in more than one place.
  const channelName = useRef(`unread-${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(channelName.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        queryClient.invalidateQueries({ queryKey: ['unread', userId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['unread', userId],
    enabled: !!userId,
    staleTime: 15_000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase.rpc('circle_unread_counts');
      if (error) throw error;
      const map = new Map<string, number>();
      for (const r of data ?? []) if (r.unread > 0) map.set(r.circle_id, r.unread);
      return map;
    },
  });
}

/** Mark a circle's discussion as read up to now (clears its unread badge). */
export function useMarkCircleRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleId: string): Promise<void> => {
      const { error } = await supabase.rpc('mark_circle_read', { p_circle: circleId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unread', userId] }),
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

/** The set of user ids the current user has blocked (their messages are hidden). */
export function useBlockedUsers(userId: string | undefined) {
  return useQuery({
    queryKey: ['blocked', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', userId as string);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.blocked_id));
    },
  });
}

/** Report a message and block/unblock its author (App Store moderation, guideline 1.2). */
export function useModeration(userId: string | undefined) {
  const queryClient = useQueryClient();

  const report = useMutation({
    mutationFn: async (input: {
      messageId: string;
      circleId: string;
      reportedUserId: string;
      reason?: string;
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase.from('message_reports').insert({
        message_id: input.messageId,
        circle_id: input.circleId,
        reporter_id: userId,
        reported_user_id: input.reportedUserId,
        reason: input.reason?.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
  });

  const block = useMutation({
    mutationFn: async (blockedId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: userId, blocked_id: blockedId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocked', userId] }),
  });

  const unblock = useMutation({
    mutationFn: async (blockedId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', blockedId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocked', userId] }),
  });

  return { report, block, unblock };
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `circle_id=eq.${circleId}`,
        },
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
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] });

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

export type RsvpStatus = 'going' | 'maybe' | 'no';

export interface EventRsvp {
  going: number;
  maybe: number;
  no: number;
  mine: RsvpStatus | null;
}

/** All RSVPs for the circle's events, aggregated per event (counts + my own). */
export function useEventRsvps(circleId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['circle-rsvps', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<Map<string, EventRsvp>> => {
      const { data, error } = await supabase
        .from('circle_event_rsvps')
        .select('event_id, user_id, status, circle_events!inner(circle_id)')
        .eq('circle_events.circle_id', circleId as string);
      if (error) throw error;
      const map = new Map<string, EventRsvp>();
      for (const r of (data ?? []) as unknown as {
        event_id: string;
        user_id: string;
        status: RsvpStatus;
      }[]) {
        const e = map.get(r.event_id) ?? { going: 0, maybe: 0, no: 0, mine: null };
        if (r.status === 'going') e.going += 1;
        else if (r.status === 'maybe') e.maybe += 1;
        else if (r.status === 'no') e.no += 1;
        if (r.user_id === userId) e.mine = r.status;
        map.set(r.event_id, e);
      }
      return map;
    },
  });
}

/** Set (or clear, when status is null) my RSVP for an event. */
export function useSetRsvp(circleId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      status,
    }: {
      eventId: string;
      status: RsvpStatus | null;
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      if (status === null) {
        const { error } = await supabase
          .from('circle_event_rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase
        .from('circle_event_rsvps')
        .upsert(
          { event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() },
          { onConflict: 'event_id,user_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-rsvps', circleId] }),
  });
}

/** A Google Calendar "add event" template URL (no OAuth needed; opens in browser). */
export function googleCalendarUrl(event: CircleEvent): string {
  const start = new Date(event.starts_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
