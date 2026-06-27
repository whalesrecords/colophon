import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface LanguishingBook {
  itemId: string;
  isbn13: string | null;
  title: string;
  coverUrl: string | null;
  startedOn: string;
  days: number;
}

/** A book "in progress" longer than this (days) is considered to be languishing. */
const THRESHOLD_DAYS = 60;

interface Row {
  id: string;
  book: { title: string | null; isbn13: string | null; cover_url: string | null } | null;
  sessions: { started_on: string | null; status: string | null }[] | null;
}

/**
 * Books stuck "in progress": status 'reading' with an open session started long
 * ago and never finished — the ones gathering dust on the nightstand.
 */
export function useLanguishing(userId: string | undefined) {
  return useQuery({
    queryKey: ['languishing', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<LanguishingBook[]> => {
      const { data, error } = await supabase
        .from('items')
        .select(
          'id, status, book:book_metadata(title, isbn13, cover_url), sessions:reading_sessions(started_on, status)',
        )
        .eq('status', 'reading');
      if (error) throw error;

      const rows = (data ?? []) as unknown as Row[];
      const now = Date.now();
      const out: LanguishingBook[] = [];
      for (const r of rows) {
        const open = (r.sessions ?? [])
          .filter((s) => s.status === 'reading' && s.started_on)
          .sort((a, b) => (a.started_on! < b.started_on! ? -1 : 1))[0];
        if (!open?.started_on) continue;
        const days = Math.floor(
          (now - new Date(`${open.started_on}T00:00:00`).getTime()) / 86_400_000,
        );
        if (days >= THRESHOLD_DAYS) {
          out.push({
            itemId: r.id,
            isbn13: r.book?.isbn13 ?? null,
            title: r.book?.title ?? 'Sans titre',
            coverUrl: r.book?.cover_url ?? null,
            startedOn: open.started_on,
            days,
          });
        }
      }
      return out.sort((a, b) => b.days - a.days);
    },
  });
}
