import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ReadingStatus } from '@/theme/tokens';

export interface LibraryStats {
  total: number;
  byStatus: Record<ReadingStatus, number>;
  pagesRead: number;
  authors: number;
  readThisYear: number;
  year: number;
}

interface ItemRow {
  id: string;
  status: ReadingStatus;
  ownership: string;
  book: { page_count: number | null; authors: string[] | null } | null;
}

interface SessionRow {
  item_id: string;
  status: string | null;
  finished_on: string | null;
}

/** Aggregate library stats from items + reading sessions. */
export function useStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['stats', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LibraryStats> => {
      const [itemsRes, sessionsRes] = await Promise.all([
        supabase.from('items').select('id, status, ownership, book:book_metadata(page_count, authors)'),
        supabase.from('reading_sessions').select('item_id, status, finished_on'),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      // Wishlist (envies) are not owned — exclude them from every count. Borrowed counts.
      const rows = ((itemsRes.data ?? []) as unknown as ItemRow[]).filter(
        (r) => r.ownership !== 'wishlist',
      );
      const presentIds = new Set(rows.map((r) => r.id));
      const sessions = (sessionsRes.data ?? []) as unknown as SessionRow[];

      const stats: LibraryStats = {
        total: rows.length,
        byStatus: { to_read: 0, reading: 0, read: 0, abandoned: 0 },
        pagesRead: 0,
        authors: 0,
        readThisYear: 0,
        year: new Date().getFullYear(),
      };

      const authorSet = new Set<string>();
      for (const row of rows) {
        const pages = row.book?.page_count ?? 0;
        if (row.status in stats.byStatus) stats.byStatus[row.status] += 1;
        if (row.status === 'read') stats.pagesRead += pages;
        for (const author of row.book?.authors ?? []) authorSet.add(author);
      }
      stats.authors = authorSet.size;

      const yearPrefix = String(stats.year);
      const finishedThisYear = new Set(
        sessions
          .filter(
            (s) =>
              s.status === 'finished' &&
              s.finished_on?.startsWith(yearPrefix) &&
              presentIds.has(s.item_id),
          )
          .map((s) => s.item_id),
      );
      stats.readThisYear = finishedThisYear.size;

      return stats;
    },
  });
}
