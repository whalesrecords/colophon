import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export interface SuggestedReader {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
  shared: number;
  sample_genres: string[] | null;
}

export type FriendStatus = 'self' | 'friends' | 'pending_out' | 'pending_in' | 'none';

export interface ReaderProfile {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
  bio: string | null;
  books: number;
  read: number;
  top_genres: string[];
  top_authors: string[];
  recent: { title: string | null; cover_url: string | null; isbn13: string | null }[];
  friend_status: FriendStatus;
}

export interface FriendPerson {
  user_id: string;
  display_name: string | null;
  pseudo: string | null;
  avatar_path: string | null;
}

export interface Friendships {
  friends: FriendPerson[];
  incoming: FriendPerson[]; // requests awaiting my response
  outgoing: FriendPerson[]; // requests I sent, pending
}

/** Readers who share your genres (theme-based recommendations). */
export function useSuggestedReaders(userId: string | undefined) {
  return useQuery({
    queryKey: ['suggested-readers', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SuggestedReader[]> => {
      const { data, error } = await supabase.rpc('suggested_readers', { p_limit: 12 });
      if (error) throw error;
      return (data ?? []) as SuggestedReader[];
    },
  });
}

/** A reader's public profile: basics, aggregates, recent reads, friend status. */
export function useReaderProfile(targetId: string | undefined) {
  return useQuery({
    queryKey: ['reader-profile', targetId],
    enabled: !!targetId,
    queryFn: async (): Promise<ReaderProfile | null> => {
      const { data, error } = await supabase.rpc('reader_profile', { p_user: targetId as string });
      if (error) throw error;
      return (data as unknown as ReaderProfile) ?? null;
    },
  });
}

/** My friends + incoming/outgoing pending requests, with profile basics. */
export function useFriendships(userId: string | undefined) {
  return useQuery({
    queryKey: ['friendships', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Friendships> => {
      const { data: rows, error } = await supabase
        .from('friendships')
        .select('requester, addressee, status');
      if (error) throw error;
      const me = userId as string;
      const others = [
        ...new Set((rows ?? []).map((r) => (r.requester === me ? r.addressee : r.requester))),
      ];
      const profileById = new Map<string, FriendPerson>();
      if (others.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, pseudo, avatar_path')
          .in('user_id', others);
        for (const p of profs ?? []) profileById.set(p.user_id, p as FriendPerson);
      }
      const person = (id: string): FriendPerson =>
        profileById.get(id) ?? { user_id: id, display_name: null, pseudo: null, avatar_path: null };

      const friends: FriendPerson[] = [];
      const incoming: FriendPerson[] = [];
      const outgoing: FriendPerson[] = [];
      for (const r of rows ?? []) {
        const other = r.requester === me ? r.addressee : r.requester;
        if (r.status === 'accepted') friends.push(person(other));
        else if (r.addressee === me) incoming.push(person(other));
        else outgoing.push(person(other));
      }
      return { friends, incoming, outgoing };
    },
  });
}

export function useFriendActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = (other?: string) => {
    queryClient.invalidateQueries({ queryKey: ['friendships', userId] });
    queryClient.invalidateQueries({ queryKey: ['suggested-readers', userId] });
    if (other) queryClient.invalidateQueries({ queryKey: ['reader-profile', other] });
  };

  const sendRequest = useMutation({
    mutationFn: async (targetId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('friendships')
        .insert({ requester: userId, addressee: targetId, status: 'pending' });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, targetId) => invalidate(targetId),
  });

  const accept = useMutation({
    mutationFn: async (requesterId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester', requesterId)
        .eq('addressee', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, requesterId) => invalidate(requesterId),
  });

  // Decline an incoming request, cancel one I sent, or unfriend — all delete the row(s).
  const remove = useMutation({
    mutationFn: async (otherId: string): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
          `and(requester.eq.${userId},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${userId})`,
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, otherId) => invalidate(otherId),
  });

  return { sendRequest, accept, remove };
}
