import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface RecapBook {
  itemId: string;
  isbn13: string | null;
  title: string;
  coverUrl: string | null;
  pages: number | null;
  finishedOn: string; // YYYY-MM-DD
}

export interface RecapMonth {
  month: number; // 0-11
  label: string; // "Janv.", "Févr.", …
  count: number;
}

export interface YearRecapData {
  year: number;
  booksRead: number;
  pages: number;
  pagesApproximate: boolean; // some books had no page count
  themes: { value: string; count: number }[];
  topAuthor: string | null;
  byMonth: RecapMonth[];
  busiestMonth: RecapMonth | null;
  books: RecapBook[]; // chronological
  firstFinish: string | null;
  lastFinish: string | null;
}

interface SessionRow {
  finished_on: string | null;
  item: {
    id: string;
    book: {
      title: string | null;
      isbn13: string | null;
      page_count: number | null;
      genres: string[] | null;
      authors: string[] | null;
      cover_url: string | null;
    } | null;
  } | null;
}

const MONTHS_FR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

/**
 * A rich "year in reading" recap, computed from the finished reading sessions of
 * a given year joined to book metadata: count, approximate pages, themes
 * (genres), top author, a per-month rhythm, and the dated list of books read.
 */
export function useYearRecap(userId: string | undefined, year: number) {
  return useQuery({
    queryKey: ['year-recap', userId, year],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<YearRecapData> => {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select(
          'finished_on, item:items(id, book:book_metadata(title, isbn13, page_count, genres, authors, cover_url))',
        )
        .eq('status', 'finished')
        .gte('finished_on', `${year}-01-01`)
        .lte('finished_on', `${year}-12-31`)
        .order('finished_on', { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as unknown as SessionRow[];

      // One entry per book (latest finish wins if re-read in the same year).
      const byItem = new Map<string, RecapBook>();
      const genreCount = new Map<string, number>();
      const authorCount = new Map<string, number>();
      const monthCount = new Array(12).fill(0);

      for (const r of rows) {
        if (!r.finished_on || !r.item) continue;
        const b = r.item.book;
        const month = Number(r.finished_on.slice(5, 7)) - 1;
        if (month >= 0 && month < 12) monthCount[month] += 1;
        if (!byItem.has(r.item.id)) {
          byItem.set(r.item.id, {
            itemId: r.item.id,
            isbn13: b?.isbn13 ?? null,
            title: b?.title ?? 'Sans titre',
            coverUrl: b?.cover_url ?? null,
            pages: b?.page_count ?? null,
            finishedOn: r.finished_on,
          });
          for (const g of b?.genres ?? []) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
          for (const a of b?.authors ?? []) authorCount.set(a, (authorCount.get(a) ?? 0) + 1);
        }
      }

      const books = [...byItem.values()];
      const pages = books.reduce((sum, b) => sum + (b.pages ?? 0), 0);
      const pagesApproximate = books.some((b) => b.pages == null);

      const themes = [...genreCount.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      const topAuthor =
        [...authorCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const byMonth: RecapMonth[] = monthCount.map((count, month) => ({
        month,
        label: MONTHS_FR[month],
        count,
      }));
      const busiestMonth =
        byMonth.reduce<RecapMonth | null>(
          (best, m) => (m.count > 0 && (!best || m.count > best.count) ? m : best),
          null,
        ) ?? null;

      return {
        year,
        booksRead: books.length,
        pages,
        pagesApproximate,
        themes,
        topAuthor,
        byMonth,
        busiestMonth,
        books,
        firstFinish: books[0]?.finishedOn ?? null,
        lastFinish: books[books.length - 1]?.finishedOn ?? null,
      };
    },
  });
}
