import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface QueueItem {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  isbn13: string | null;
  queuePosition: number | null;
}

interface Row {
  id: string;
  queue_position: number | null;
  added_at: string;
  cover_override: string | null;
  book: {
    title: string | null;
    isbn13: string | null;
    cover_url: string | null;
    authors: string[] | null;
  } | null;
}

export interface ReadingQueue {
  queue: QueueItem[]; // explicitly prioritised, in order
  rest: QueueItem[]; // the rest of the to-read pile, newest first
}

const toItem = (r: Row): QueueItem => ({
  id: r.id,
  title: r.book?.title ?? 'Sans titre',
  author: r.book?.authors?.[0] ?? null,
  coverUrl: r.cover_override ?? r.book?.cover_url ?? null,
  isbn13: r.book?.isbn13 ?? null,
  queuePosition: r.queue_position,
});

/** The "to read" pile split into a prioritised queue + the unordered rest. */
export function useReadingQueue(userId: string | undefined) {
  return useQuery({
    queryKey: ['reading-queue', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ReadingQueue> => {
      const { data, error } = await supabase
        .from('items')
        .select(
          'id, queue_position, added_at, cover_override, book:book_metadata(title, isbn13, cover_url, authors)',
        )
        .eq('status', 'to_read')
        .neq('ownership', 'wishlist');
      if (error) throw error;
      const rows = (data ?? []) as unknown as Row[];
      const queue = rows
        .filter((r) => r.queue_position != null)
        .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
        .map(toItem);
      const rest = rows
        .filter((r) => r.queue_position == null)
        .sort((a, b) => (a.added_at < b.added_at ? 1 : -1))
        .map(toItem);
      return { queue, rest };
    },
  });
}

export function useQueueActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reading-queue', userId] });
    queryClient.invalidateQueries({ queryKey: ['library'] });
  };

  /** Persist a new order for the prioritised queue (positions 0..n-1). */
  const setOrder = useMutation({
    mutationFn: async (orderedIds: string[]): Promise<void> => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('items').update({ queue_position: i }).eq('id', id),
        ),
      );
    },
    onSuccess: invalidate,
  });

  /** Append a book to the end of the prioritised queue. */
  const addToQueue = useMutation({
    mutationFn: async ({ itemId, atEnd }: { itemId: string; atEnd: number }): Promise<void> => {
      const { error } = await supabase
        .from('items')
        .update({ queue_position: atEnd })
        .eq('id', itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  /** Take a book out of the prioritised queue (back to the unordered pile). */
  const removeFromQueue = useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { error } = await supabase
        .from('items')
        .update({ queue_position: null })
        .eq('id', itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { setOrder, addToQueue, removeFromQueue };
}
