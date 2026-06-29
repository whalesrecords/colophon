import { ExtensionStorage } from '@bacons/apple-targets';

/**
 * Push the daily-goal / streak snapshot to the iOS home-screen widget.
 *
 * Writes to the App Group's shared UserDefaults (read by the WidgetKit extension in
 * `targets/widget/`) and reloads the widget timeline. `@bacons/apple-targets` falls
 * back to a no-op when the native module is absent, so this is safe to call on web
 * and Android (it simply does nothing there). iOS needs an EAS build + the App Group
 * capability for it to take effect — see docs/widgets.md.
 */
const APP_GROUP = 'group.com.whalesrecords.colophon';
const storage = new ExtensionStorage(APP_GROUP);

export function syncReadingWidget(data: { streak: number; today: number; goal: number }): void {
  try {
    storage.set('streak', Math.max(0, Math.round(data.streak)));
    storage.set('today', Math.max(0, Math.round(data.today)));
    storage.set('goal', Math.max(1, Math.round(data.goal)));
    ExtensionStorage.reloadWidget();
  } catch {
    // no-op — widget not available on this platform/build
  }
}
