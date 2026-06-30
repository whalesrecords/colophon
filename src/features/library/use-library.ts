import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { BookFormat, Ownership, ReadingStatus } from '@/theme/tokens';

export interface LibraryBook {
  isbn13: string;
  title: string | null;
  authors: string[] | null;
  publisher: string | null;
  language: string | null;
  published_date: string | null;
  cover_url: string | null;
  genres: string[] | null;
}

export interface LibraryItem {
  id: string;
  status: ReadingStatus;
  ownership: Ownership;
  format: BookFormat | null;
  borrowedFrom: string | null;
  rating: number | null;
  added_at: string;
  coverOverride: string | null;
  book: LibraryBook | null;
  shelfNames: string[];
  tagNames: string[];
  lentTo: string | null;
}

const SELECT =
  'id, status, ownership, format, borrowed_from, rating, added_at, cover_override, book:book_metadata(isbn13, title, authors, publisher, language, published_date, cover_url, genres), item_shelves(shelves(name)), item_tags(tags(name)), loans(borrower, returned_on)';

interface RawRow {
  id: string;
  status: ReadingStatus;
  ownership: Ownership;
  format: string | null;
  borrowed_from: string | null;
  rating: number | null;
  added_at: string;
  cover_override: string | null;
  book: LibraryBook | null;
  item_shelves: { shelves: { name: string | null } | null }[] | null;
  item_tags: { tags: { name: string | null } | null }[] | null;
  loans: { borrower: string; returned_on: string | null }[] | null;
}

/** The current user's library: items newest-first, joined with book metadata + shelves. */
export function useLibrary(userId: string | undefined) {
  return useQuery({
    queryKey: ['library', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LibraryItem[]> => {
      // PostgREST caps each response at 1000 rows — page through so big collections
      // (a serious manga library runs to many thousands) load in full.
      const PAGE = 1000;
      const raw: RawRow[] = [];
      for (let from = 0; from < 60000; from += PAGE) {
        const { data, error } = await supabase
          .from('items')
          .select(SELECT)
          .order('added_at', { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const page = (data ?? []) as unknown as RawRow[];
        raw.push(...page);
        if (page.length < PAGE) break;
      }
      return raw.map((row) => ({
        id: row.id,
        status: row.status,
        ownership: row.ownership ?? 'owned',
        format: (row.format as BookFormat | null) ?? null,
        borrowedFrom: row.borrowed_from,
        rating: row.rating,
        added_at: row.added_at,
        coverOverride: row.cover_override,
        book: row.book,
        shelfNames: (row.item_shelves ?? [])
          .map((s) => s.shelves?.name)
          .filter((n): n is string => !!n),
        tagNames: (row.item_tags ?? []).map((t) => t.tags?.name).filter((n): n is string => !!n),
        lentTo: (row.loans ?? []).find((l) => !l.returned_on)?.borrower ?? null,
      }));
    },
  });
}
