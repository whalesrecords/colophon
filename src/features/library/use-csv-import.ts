import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useIsbnLookup } from '@/features/books/use-isbn-lookup';
import type { ImportedBook } from '@/lib/book-csv';
import { supabase } from '@/lib/supabase';

export interface ImportProgress {
  done: number;
  total: number;
}

/**
 * Import parsed CSV books sequentially: resolve each ISBN via the lookup cascade
 * (which caches book_metadata), then insert the copy with its status, rating and
 * review. Gentle on the lookup API, like the scan bulk-import.
 */
export function useCsvImport(userId: string | undefined) {
  const lookup = useIsbnLookup();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<{ added: number; failed: number } | null>(null);

  const run = async (books: ImportedBook[]): Promise<void> => {
    if (!userId || books.length === 0) return;
    setResult(null);
    setProgress({ done: 0, total: books.length });
    let added = 0;
    let failed = 0;

    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      try {
        const meta = await lookup.mutateAsync(b.isbn13);
        const { error } = await supabase.from('items').insert({
          isbn13: meta.isbn13,
          user_id: userId,
          ...(b.status ? { status: b.status } : {}),
          ...(b.rating != null ? { rating: b.rating } : {}),
          ...(b.notes ? { notes: b.notes } : {}),
        });
        if (error) throw new Error(error.message);
        added++;
      } catch {
        failed++;
      }
      setProgress({ done: i + 1, total: books.length });
    }

    queryClient.invalidateQueries({ queryKey: ['library'] });
    setProgress(null);
    setResult({ added, failed });
  };

  return { run, progress, result };
}
