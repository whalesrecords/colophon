/**
 * @bacons/apple-targets — watchOS companion app ("Colophon" on the wrist):
 * current read + progress, a reading chronometer, and quick page bumps. Talks to the
 * phone over WatchConnectivity (see targets/watch/index.swift + docs/watch.md).
 *
 * ⚠️ DISABLED ON PURPOSE — this file is `.disabled` so the plugin's `targets/*` glob
 * does NOT pick it up. A live watch target would make every (non-interactive) EAS
 * build try to provision the watch app and fail, exactly like the widget did at first.
 * To activate: rename to `expo-target.config.js`, run ONE interactive iOS build to
 * create the watch app's provisioning profile, then headless builds work again.
 * Full steps in docs/watch.md.
 *
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'watch',
  // Sanitized (no spaces/punctuation) — EAS looks the target up by this exact name.
  name: 'ColophonWatch',
  deploymentTarget: '9.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.whalesrecords.colophon'],
  },
};
