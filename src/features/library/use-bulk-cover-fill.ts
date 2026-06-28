import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

import type { LibraryItem } from './use-library';

/** A library item shows the composed placeholder when it has neither an override
 *  nor a stored cover URL — those are the ones a deep search can rescue. */
export function missingCover(item: LibraryItem): boolean {
  return !item.coverOverride?.trim() && !item.book?.cover_url?.trim();
}

export interface BulkCoverProgress {
  running: boolean;
  total: number;
  done: number;
  found: number;
}

const IDLE: BulkCoverProgress = { running: false, total: 0, done: 0, found: 0 };
const CONCURRENCY = 3; // gentle on the cascade (Google Books rate-limits hard)

interface CoverSearchResult {
  candidates?: { url: string; source: string }[];
}

/**
 * Bulk "recherche approfondie" of covers for the whole library: finds every book
 * with no cover, runs the deep cover-search for each (limited concurrency) and
 * auto-applies the first validated candidate as the item's cover override. The
 * user can still change any of them afterwards via the per-book CoverPicker.
 */
export function useBulkCoverFill(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<BulkCoverProgress>(IDLE);
  const cancelRef = useRef(false);

  const run = useCallback(
    async (items: LibraryItem[]) => {
      if (!userId) return;
      const targets = items.filter(missingCover);
      cancelRef.current = false;
      setProgress({ running: true, total: targets.length, done: 0, found: 0 });
      if (targets.length === 0) {
        setProgress({ ...IDLE });
        return;
      }

      let done = 0;
      let found = 0;
      let next = 0;

      const worker = async (): Promise<void> => {
        for (;;) {
          if (cancelRef.current) return;
          const i = next++;
          if (i >= targets.length) return;
          const it = targets[i];
          try {
            const { data } = await supabase.functions.invoke('cover-search', {
              body: {
                isbn13: it.book?.isbn13,
                title: it.book?.title ?? undefined,
                author: it.book?.authors?.[0],
              },
            });
            const best = (data as CoverSearchResult | null)?.candidates?.[0];
            if (best?.url) {
              const { error } = await supabase
                .from('items')
                .update({ cover_override: best.url })
                .eq('id', it.id);
              if (!error) found += 1;
            }
          } catch {
            // A single lookup failure shouldn't abort the whole run.
          }
          done += 1;
          setProgress({ running: true, total: targets.length, done, found });
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()),
      );
      setProgress((p) => ({ ...p, running: false }));
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
    [userId, queryClient],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => setProgress({ ...IDLE }), []);

  return { run, cancel, reset, progress };
}
