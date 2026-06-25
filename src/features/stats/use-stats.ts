import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ReadingStatus } from '@/theme/tokens';

export interface LibraryStats {
  total: number;
  byStatus: Record<ReadingStatus, number>;
  pagesRead: number;
  pagesOwned: number;
  authors: number;
}

interface Row {
  status: ReadingStatus;
  book: { page_count: number | null; authors: string[] | null } | null;
}

/** Aggregate library stats from items joined with their book metadata. */
export function useStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['stats', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LibraryStats> => {
      const { data, error } = await supabase
        .from('items')
        .select('status, book:book_metadata(page_count, authors)');
      if (error) throw error;

      const rows = (data ?? []) as unknown as Row[];
      const stats: LibraryStats = {
        total: rows.length,
        byStatus: { to_read: 0, reading: 0, read: 0, abandoned: 0 },
        pagesRead: 0,
        pagesOwned: 0,
        authors: 0,
      };
      const authorSet = new Set<string>();
      for (const row of rows) {
        const pages = row.book?.page_count ?? 0;
        stats.pagesOwned += pages;
        if (row.status in stats.byStatus) stats.byStatus[row.status] += 1;
        if (row.status === 'read') stats.pagesRead += pages;
        for (const author of row.book?.authors ?? []) authorSet.add(author);
      }
      stats.authors = authorSet.size;
      return stats;
    },
  });
}
