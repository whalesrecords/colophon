import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * A tiny persisted cooldown for gentle prompts: `active` is true until the reader
 * dismisses (then hidden for `cooldownMs`, e.g. a few days). Used by the low-priority
 * engagement nudges (librairie, cercles…) so none of them nags. Non-anxiety-inducing
 * per the app guardrail — every prompt built on this stays escapable and infrequent.
 */
export function useSnooze(key: string, cooldownMs: number) {
  const [until, setUntil] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((v) => {
        if (v) setUntil(Number(v) || null);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [key]);

  const snooze = useCallback(() => {
    const u = Date.now() + cooldownMs;
    setUntil(u);
    AsyncStorage.setItem(key, String(u)).catch(() => {});
  }, [key, cooldownMs]);

  const active = ready && (until == null || until < Date.now());
  return { active, snooze, ready };
}
