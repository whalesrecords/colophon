/**
 * @bacons/apple-targets — iOS WidgetKit extension for the reading streak / daily goal.
 * The widget reads the shared App Group UserDefaults written by the app
 * (src/features/reading/widget-sync.ts). Activated at `expo prebuild` / EAS build.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'widget',
  name: 'Colophon — Lecture',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.whalesrecords.colophon'],
  },
};
