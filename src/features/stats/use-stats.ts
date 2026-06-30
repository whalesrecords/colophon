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
  collectionValue: number; // sum of purchase prices of OWNED items
  pricedCount: number; // how many owned items have a price
  acquiredThisYear: number; // owned items bought this year (by purchase_date)
  spentThisYear: number; // total spent this year
  resaleValue: number; // sum of estimated resale values of OWNED items
  resaleCount: number; // how many owned items have an estimated value
}

interface ItemRow {
  id: string;
  status: ReadingStatus;
  ownership: string;
  purchase_price: number | null;
  purchase_date: string | null;
  estimated_value: number | null;
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
      // Page past PostgREST's 1000-row cap so stats are exact for big collections.
      const fetchAll = async <R>(
        build: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
      ): Promise<R[]> => {
        const PAGE = 1000;
        const out: R[] = [];
        for (let from = 0; from < 100000; from += PAGE) {
          const { data, error } = await build(from, from + PAGE - 1);
          if (error) throw error;
          const page = (data ?? []) as R[];
          out.push(...page);
          if (page.length < PAGE) break;
        }
        return out;
      };

      const [itemsData, sessions] = await Promise.all([
        fetchAll<ItemRow>((from, to) =>
          supabase
            .from('items')
            .select(
              'id, status, ownership, purchase_price, purchase_date, estimated_value, book:book_metadata(page_count, authors)',
            )
            .range(from, to),
        ),
        fetchAll<SessionRow>((from, to) =>
          supabase.from('reading_sessions').select('item_id, status, finished_on').range(from, to),
        ),
      ]);

      // Wishlist (envies) are not owned — exclude them from every count. Borrowed counts.
      const rows = itemsData.filter((r) => r.ownership !== 'wishlist');
      const presentIds = new Set(rows.map((r) => r.id));

      const stats: LibraryStats = {
        total: rows.length,
        byStatus: { to_read: 0, reading: 0, read: 0, abandoned: 0 },
        pagesRead: 0,
        authors: 0,
        readThisYear: 0,
        year: new Date().getFullYear(),
        collectionValue: 0,
        pricedCount: 0,
        acquiredThisYear: 0,
        spentThisYear: 0,
        resaleValue: 0,
        resaleCount: 0,
      };

      const yearPrefix = String(stats.year);
      const authorSet = new Set<string>();
      for (const row of rows) {
        const pages = row.book?.page_count ?? 0;
        if (row.status in stats.byStatus) stats.byStatus[row.status] += 1;
        if (row.status === 'read') stats.pagesRead += pages;
        for (const author of row.book?.authors ?? []) authorSet.add(author);
        // Collection value + acquisition rhythm count owned copies you bought.
        if (row.ownership === 'owned') {
          const price = row.purchase_price != null ? Number(row.purchase_price) : null;
          if (price != null && Number.isFinite(price)) {
            stats.collectionValue += price;
            stats.pricedCount += 1;
          }
          if (row.purchase_date?.startsWith(yearPrefix)) {
            stats.acquiredThisYear += 1;
            if (price != null && Number.isFinite(price)) stats.spentThisYear += price;
          }
          const resale = row.estimated_value != null ? Number(row.estimated_value) : null;
          if (resale != null && Number.isFinite(resale)) {
            stats.resaleValue += resale;
            stats.resaleCount += 1;
          }
        }
      }
      stats.authors = authorSet.size;
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
