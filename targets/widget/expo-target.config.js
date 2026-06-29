/**
 * @bacons/apple-targets — iOS WidgetKit extension for the reading streak / daily goal.
 * The widget reads the shared App Group UserDefaults written by the app
 * (src/features/reading/widget-sync.ts). Activated at `expo prebuild` / EAS build.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'widget',
  // Must be sanitized (no spaces/punctuation): EAS looks up the target by this exact
  // name, while the Xcode target name keeps it verbatim — a mismatch breaks the build.
  // The user-facing widget title is set in index.swift (configurationDisplayName).
  name: 'ColophonLecture',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.whalesrecords.colophon'],
  },
};
