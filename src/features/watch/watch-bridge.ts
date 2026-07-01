import { requireOptionalNativeModule } from 'expo';

import { supabase } from '@/lib/supabase';

/**
 * Phone-side half of the Apple Watch bridge. Native (`WatchBridgeModule`) owns
 * WCSession; this JS layer owns Supabase. The native module forwards the watch's
 * minute/page logs as `onWatchLog` events, and we run the matching RPC here (the
 * auth token never leaves JS). No-op on web / Android / Catalyst / pre-build,
 * where the native module is absent — every call is guarded by `native?.`.
 */
type WatchLog = { type?: string; value?: number; cr_session?: string };

const native = requireOptionalNativeModule<{
  push(session: string | null): void;
  isSupported(): boolean;
  addListener(event: 'onWatchLog', listener: (payload: WatchLog) => void): { remove(): void };
}>('WatchBridgeModule');

/** True when a real WCSession is available (native iOS build with a paired watch). */
export function watchSupported(): boolean {
  return native?.isSupported() ?? false;
}

/**
 * Push the current-read + goal snapshot to the watch. The App Group keys are
 * already written by `syncCurrentReadWidget`; pass the open reading session id so
 * the watch can echo it back on a log. Call next to the widget sync in LibraryHome.
 */
export function pushToWatch(sessionId: string | null): void {
  native?.push(sessionId);
}

/**
 * Register once (from the auth provider, when signed in): apply the watch's
 * minute/page logs to Supabase. Returns an unsubscribe fn (or undefined if the
 * native module is absent).
 */
export function subscribeWatchLogs(): (() => void) | undefined {
  const sub = native?.addListener('onWatchLog', async (raw) => {
    // The watch queues logs as { pending: {...} } when the phone was unreachable.
    const m: WatchLog = (raw as { pending?: WatchLog })?.pending ?? raw;
    if (!m?.cr_session || typeof m.value !== 'number') return;
    try {
      if (m.type === 'minutes') {
        await supabase.rpc('log_reading_minutes', {
          p_session: m.cr_session,
          p_minutes: m.value,
        });
      } else if (m.type === 'page') {
        await supabase.rpc('record_reading_page', {
          p_session: m.cr_session,
          p_page: m.value,
        });
      }
    } catch {
      // best-effort; the watch will re-push on the next context update
    }
  });
  return sub ? () => sub.remove() : undefined;
}
