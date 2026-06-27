/**
 * Device push-token registration — TEMPORARILY DISABLED.
 *
 * `expo-notifications` adds the iOS `aps-environment` entitlement just by being
 * installed (autolinked), which fails the App Store archive until the bundle id's
 * Push Notifications capability + an APNs key + a regenerated provisioning profile
 * exist (an interactive Apple Developer setup). So the package is uninstalled for
 * now and this hook is a no-op.
 *
 * The rest of the push pipeline stays live: the `push_tokens` table, the
 * `send-push` edge function, and the `messages` insert trigger. To turn delivery
 * back on: `eas credentials` (iOS Push key) → `npx expo install expo-notifications
 * expo-device` → re-add `"expo-notifications"` to app.json plugins → restore the
 * getExpoPushTokenAsync()/upsert body here → rebuild.
 */
export function usePushRegistration(_userId: string | undefined): void {
  // no-op
}
