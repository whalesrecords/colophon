import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLibrary, type LibraryItem } from '@/features/library/use-library';

const KEY = 'colophon.readingNudge';
/** Hide the whole prompt this long after a "Plus tard" (a gentle day, not forever). */
const SNOOZE_MS = 20 * 60 * 60 * 1000;

interface NudgeState {
  snoozeUntil: number | null;
  skipped: string[];
}

const EMPTY: NudgeState = { snoozeUntil: null, skipped: [] };

/**
 * Which finished books still have an empty "fiche de lecture" (no rating). Feeds the
 * gentle `ReadingNudge` prompt on Home. Non-anxiety-inducing per the app's guardrail:
 * always skippable per book and snoozable as a whole ("Plus tard" → hidden ~a day),
 * never nags a book the reader rated or explicitly passed. Reading owned/borrowed only
 * (a wishlist book can't have been read).
 */
export function useReadingNudge(userId: string | undefined) {
  const { data: items } = useLibrary(userId);
  const [state, setState] = useState<NudgeState>(EMPTY);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v) setState({ ...EMPTY, ...(JSON.parse(v) as Partial<NudgeState>) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  const persist = useCallback((next: NudgeState) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const skip = useCallback(
    (id: string) => {
      persist({ ...state, skipped: [...new Set([...state.skipped, id])] });
    },
    [persist, state],
  );

  const snooze = useCallback(() => {
    persist({ ...state, snoozeUntil: Date.now() + SNOOZE_MS });
  }, [persist, state]);

  const pending = useMemo<LibraryItem[]>(() => {
    if (!items) return [];
    const skipped = new Set(state.skipped);
    return items.filter(
      (it) =>
        it.status === 'read' &&
        it.rating == null &&
        it.ownership !== 'wishlist' &&
        it.book?.title &&
        !skipped.has(it.id),
    );
  }, [items, state.skipped]);

  const snoozed = state.snoozeUntil != null && state.snoozeUntil > Date.now();
  const next = !snoozed && loaded.current ? (pending[0] ?? null) : null;

  return { next, count: pending.length, skip, snooze, ready: loaded.current };
}
