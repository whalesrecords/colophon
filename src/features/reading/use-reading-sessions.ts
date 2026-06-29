import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CurrentRead {
  itemId: string;
  title: string | null;
  author: string | null;
  coverUrl: string | null;
  isbn13: string | null;
  currentPage: number;
  totalPages: number | null;
  /** true when there's no open session — this is the most recently finished book. */
  justFinished: boolean;
}

interface SessionItemRow {
  item_id: string;
  current_page: number | null;
  total_pages: number | null;
  item: {
    cover_override: string | null;
    book: {
      title: string | null;
      authors: string[] | null;
      cover_url: string | null;
      isbn13: string;
    } | null;
  } | null;
}

function toCurrentRead(row: SessionItemRow, justFinished: boolean): CurrentRead {
  const book = row.item?.book ?? null;
  return {
    itemId: row.item_id,
    title: book?.title ?? null,
    author: book?.authors?.[0] ?? null,
    coverUrl: row.item?.cover_override ?? book?.cover_url ?? null,
    isbn13: book?.isbn13 ?? null,
    currentPage: row.current_page ?? 0,
    totalPages: row.total_pages,
    justFinished,
  };
}

const CURRENT_SELECT =
  'item_id, current_page, total_pages, item:items!inner(cover_override, book:book_metadata(title, authors, cover_url, isbn13))';

/**
 * The book to surface on the home screen: the open reading session (most recent),
 * or — failing that — the most recently finished book ("ce qu'on vient de lire").
 */
export function useCurrentlyReading(userId: string | undefined) {
  return useQuery({
    queryKey: ['currently-reading', userId],
    enabled: !!userId,
    queryFn: async (): Promise<CurrentRead | null> => {
      const reading = await supabase
        .from('reading_sessions')
        .select(CURRENT_SELECT)
        .eq('status', 'reading')
        .order('created_at', { ascending: false })
        .limit(1);
      if (reading.error) throw reading.error;
      const open = (reading.data ?? []) as unknown as SessionItemRow[];
      if (open[0]) return toCurrentRead(open[0], false);

      const done = await supabase
        .from('reading_sessions')
        .select(CURRENT_SELECT)
        .eq('status', 'finished')
        .order('finished_on', { ascending: false, nullsFirst: false })
        .limit(1);
      if (done.error) throw done.error;
      const last = (done.data ?? []) as unknown as SessionItemRow[];
      return last[0] ? toCurrentRead(last[0], true) : null;
    },
  });
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
    queryClient.invalidateQueries({ queryKey: ['currently-reading', userId] });
    queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    queryClient.invalidateQueries({ queryKey: ['daily-goal', userId] });
    // A date edit can move a read into/out of a year — clear all year recaps.
    queryClient.invalidateQueries({ queryKey: ['year-recap'] });
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
      // One RPC updates the page AND recomputes today's daily goal as the NET advance
      // for the day (current page minus the page at the start of today) — so going
      // back and forth / correcting a typo can't inflate the count.
      const { error } = await supabase.rpc('record_reading_page', {
        p_session: sessionId,
        p_page: Math.max(0, page),
      });
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

  /** Edit a session's dates — e.g. mark a book as read years ago, not today. */
  const updateDates = useMutation({
    mutationFn: async ({
      sessionId,
      startedOn,
      finishedOn,
    }: {
      sessionId: string;
      startedOn?: string | null;
      finishedOn?: string | null;
    }): Promise<void> => {
      const patch: { started_on?: string | null; finished_on?: string | null } = {};
      if (startedOn !== undefined) patch.started_on = startedOn;
      if (finishedOn !== undefined) patch.finished_on = finishedOn;
      const { error } = await supabase.from('reading_sessions').update(patch).eq('id', sessionId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { start, setPage, finish, remove, updateDates };
}

/**
 * Mark several books (e.g. a whole series, or its first N volumes) as read at
 * once: items.status='read' + a finished session today for any that don't already
 * have one this year, so they count in "Lus en {year}".
 */
export function useMarkSeriesRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemIds: string[]; finishedOn?: string }): Promise<void> => {
      const { itemIds } = input;
      if (itemIds.length === 0) return;
      const date = input.finishedOn?.trim() || today();
      const { error: upd } = await supabase
        .from('items')
        .update({ status: 'read' })
        .in('id', itemIds);
      if (upd) throw new Error(upd.message);

      // Don't double-count: skip items that already have a finished session in the
      // chosen date's year.
      const year = date.slice(0, 4);
      const { data: existing } = await supabase
        .from('reading_sessions')
        .select('item_id, finished_on')
        .in('item_id', itemIds)
        .eq('status', 'finished');
      const haveThatYear = new Set(
        (existing ?? []).filter((s) => s.finished_on?.startsWith(year)).map((s) => s.item_id),
      );
      const rows = itemIds
        .filter((id) => !haveThatYear.has(id))
        .map((id) => ({
          item_id: id,
          status: 'finished' as const,
          started_on: date,
          finished_on: date,
        }));
      if (rows.length) {
        const { error } = await supabase.from('reading_sessions').insert(rows);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['currently-reading', userId] });
      queryClient.invalidateQueries({ queryKey: ['year-recap'] });
    },
  });
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
