import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Registers this device's Expo push token for the signed-in user (native only —
 * web keeps the in-app unread badges). Best-effort: silently no-ops if permission
 * is denied or we're on a simulator. Real delivery still needs a native build with
 * EAS push credentials (APNs / FCM); the token table + send-push function are the
 * server side of it.
 */
export function usePushRegistration(userId: string | undefined) {
  useEffect(() => {
    if (!userId || Platform.OS === 'web' || !Device.isDevice) return;
    let cancelled = false;

    void (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let granted = existing.granted;
        if (!granted && existing.canAskAgain) {
          const req = await Notifications.requestPermissionsAsync();
          granted = req.granted;
        }
        if (!granted || cancelled) return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
        const resp = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = resp.data;
        if (cancelled || !token) return;

        await supabase.from('push_tokens').upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' },
        );
      } catch {
        // Push is optional — never block the app on it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
