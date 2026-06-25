import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

interface MiniBook {
  isbn13: string;
  title: string | null;
  authors: string[] | null;
  cover_url: string | null;
}

// ── Per-member circle library + reading status ──────────────────────────────
export interface CircleBookRow {
  circle_id: string;
  user_id: string;
  isbn13: string;
  reading_status: string;
  rating: number | null;
  finished_on: string | null;
  book: MiniBook | null;
}

export function useCircleLibrary(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle-library', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CircleBookRow[]> => {
      const { data, error } = await supabase
        .from('circle_books')
        .select(
          'circle_id, user_id, isbn13, reading_status, rating, finished_on, book:book_metadata(isbn13, title, authors, cover_url)',
        )
        .eq('circle_id', circleId as string)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CircleBookRow[];
    },
  });
}

export function useCircleBookActions(circleId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['circle-library', circleId] });

  const contribute = useMutation({
    mutationFn: async (input: { isbn13: string; status?: string }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase.from('circle_books').upsert(
        {
          circle_id: circleId,
          user_id: userId,
          isbn13: input.isbn13,
          reading_status: input.status ?? 'to_read',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'circle_id,user_id,isbn13' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: async (input: { isbn13: string; status: string }): Promise<void> => {
      const { error } = await supabase
        .from('circle_books')
        .update({ reading_status: input.status, updated_at: new Date().toISOString() })
        .eq('circle_id', circleId)
        .eq('user_id', userId as string)
        .eq('isbn13', input.isbn13);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (isbn13: string): Promise<void> => {
      const { error } = await supabase
        .from('circle_books')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', userId as string)
        .eq('isbn13', isbn13);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { contribute, setStatus, remove };
}

// ── Per-book comments ───────────────────────────────────────────────────────
export interface BookComment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export function useBookComments(circleId: string | undefined, isbn13: string | undefined) {
  return useQuery({
    queryKey: ['circle-comments', circleId, isbn13],
    enabled: !!circleId && !!isbn13,
    queryFn: async (): Promise<BookComment[]> => {
      const { data, error } = await supabase
        .from('circle_book_comments')
        .select('id, user_id, body, created_at')
        .eq('circle_id', circleId as string)
        .eq('isbn13', isbn13 as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCommentActions(circleId: string, isbn13: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['circle-comments', circleId, isbn13] });

  const add = useMutation({
    mutationFn: async (body: string): Promise<void> => {
      const text = body.trim();
      if (!text || !userId) return;
      const { error } = await supabase
        .from('circle_book_comments')
        .insert({ circle_id: circleId, isbn13, user_id: userId, body: text });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('circle_book_comments').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

// ── Reading proposals + votes ───────────────────────────────────────────────
export interface ProposalRow {
  id: string;
  isbn13: string;
  proposed_by: string;
  note: string | null;
  status: string;
  book: MiniBook | null;
  votes: { user_id: string }[] | null;
}

export function useProposals(circleId: string | undefined) {
  return useQuery({
    queryKey: ['circle-proposals', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<ProposalRow[]> => {
      const { data, error } = await supabase
        .from('circle_proposals')
        .select(
          'id, isbn13, proposed_by, note, status, book:book_metadata(isbn13, title, authors, cover_url), votes:circle_proposal_votes(user_id)',
        )
        .eq('circle_id', circleId as string)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProposalRow[];
    },
  });
}

export function useProposalActions(circleId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['circle-proposals', circleId] });

  const propose = useMutation({
    mutationFn: async (input: { isbn13: string; note?: string }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase.from('circle_proposals').insert({
        circle_id: circleId,
        isbn13: input.isbn13,
        proposed_by: userId,
        note: input.note?.trim() || null,
      });
      if (error) {
        throw new Error(
          error.message.includes('duplicate') ? 'Ce livre est déjà proposé.' : error.message,
        );
      }
    },
    onSuccess: invalidate,
  });

  const toggleVote = useMutation({
    mutationFn: async (proposalId: string): Promise<void> => {
      const { error } = await supabase.rpc('toggle_proposal_vote', { p_proposal_id: proposalId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: async (input: { id: string; status: string }): Promise<void> => {
      const { error } = await supabase
        .from('circle_proposals')
        .update({ status: input.status })
        .eq('id', input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('circle_proposals').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { propose, toggleVote, setStatus, remove };
}
