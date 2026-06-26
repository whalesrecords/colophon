import { useCallback, useRef, useState } from 'react';

import { type BookMetadata, useIsbnLookup } from '@/features/books/use-isbn-lookup';
import { type AddItemInput, useAddItem } from '@/features/library/use-add-item';
import { normalizeIsbn } from '@/lib/isbn';

/** Possession + reading-status chosen at add time (defaults to owned/to_read). */
export type AddOptions = Omit<AddItemInput, 'isbn13'>;

export type ScanStatus = 'looking' | 'added' | 'error';

export interface ScanEntry {
  key: string;
  isbn13: string | null;
  status: ScanStatus;
  book?: BookMetadata;
  error?: string;
}

/**
 * Drives a scan/manual-entry session: each submitted ISBN is normalized, looked
 * up via the edge function, and added to the library — accumulating into a
 * newest-first list. The same ISBN can't be added twice in one session.
 */
export function useScanSession(userId: string | undefined) {
  const lookup = useIsbnLookup();
  const addItem = useAddItem(userId);
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const update = useCallback((key: string, patch: Partial<ScanEntry>) => {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }, []);

  const submit = useCallback(
    async (raw: string, opts?: AddOptions): Promise<boolean> => {
      const norm = normalizeIsbn(raw);
      const isbn13 = norm.ok ? norm.isbn13 : null;
      const key = isbn13 ?? raw.trim();
      if (!key) return false;
      if (isbn13 && seen.current.has(isbn13)) return false; // already this session

      if (isbn13) seen.current.add(isbn13);
      setEntries((prev) => [
        { key, isbn13, status: 'looking' },
        ...prev.filter((e) => e.key !== key),
      ]);

      try {
        const book = await lookup.mutateAsync(raw);
        await addItem.mutateAsync({ isbn13: book.isbn13, ...opts });
        update(key, { isbn13: book.isbn13, status: 'added', book });
        return true;
      } catch (err) {
        if (isbn13) seen.current.delete(isbn13); // allow a retry
        update(key, { status: 'error', error: err instanceof Error ? err.message : 'Erreur' });
        return false;
      }
    },
    [lookup, addItem, update],
  );

  const retry = useCallback(
    (key: string, opts?: AddOptions) => {
      const entry = entries.find((e) => e.key === key);
      if (entry) void submit(entry.isbn13 ?? entry.key, opts);
    },
    [entries, submit],
  );

  /** Bulk import: submit each ISBN sequentially (gentle on the lookup API). */
  const submitMany = useCallback(
    async (isbns: string[], opts?: AddOptions): Promise<void> => {
      if (isbns.length === 0) return;
      setBulk({ done: 0, total: isbns.length });
      for (let i = 0; i < isbns.length; i++) {
        await submit(isbns[i], opts);
        setBulk({ done: i + 1, total: isbns.length });
      }
      setBulk(null);
    },
    [submit],
  );

  const addedCount = entries.filter((e) => e.status === 'added').length;

  return { entries, submit, submitMany, retry, addedCount, bulk };
}
