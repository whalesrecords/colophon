# iOS home-screen widget — "Ma série de lecture"

A WidgetKit widget showing the daily reading goal + streak (and later, challenge
progress), via [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets).

## How it works

- **`targets/widget/index.swift`** — the SwiftUI widget. Reads the shared App Group
  `UserDefaults(suiteName: "group.com.whalesrecords.colophon")` for `streak`, `today`,
  `goal` and draws the Colophon ring + 🔥 streak.
- **`targets/widget/expo-target.config.js`** — declares the widget extension target +
  its App Group entitlement.
- **`src/features/reading/widget-sync.ts`** — `syncReadingWidget()` writes those keys
  to the App Group and calls `ExtensionStorage.reloadWidget()`. Called from
  `DailyGoalCard` whenever the streak/goal changes. **No-ops on web + Android** (the
  native module is absent there), so it's safe in every build.
- **`app.json`** — the `@bacons/apple-targets` plugin + the app's App Group entitlement.

## Activating it (needs a native build — NOT Expo Go / web)

1. `pnpm install` (already adds `@bacons/apple-targets`).
2. **Register the App Group** `group.com.whalesrecords.colophon` in the Apple Developer
   portal (Certificates, Identifiers & Profiles → Identifiers → App Groups), and make
   sure it's enabled on both the app id `com.whalesrecords.colophon` and the widget id
   `com.whalesrecords.colophon.widget`. EAS-managed credentials usually create the
   extension id automatically; the App Group may need to be created once by hand.
3. `npx expo prebuild -p ios --clean` (locally) to generate the widget target, **or**
   just run an EAS build — prebuild runs there too.
4. `EXPO_TOKEN=… npx eas-cli build -p ios --profile production --auto-submit` → TestFlight.
5. On the device: long-press the home screen → **+** → search "Colophon" → add the
   "Ma série de lecture" widget.

## Gotchas

- If the build complains about a signing **team**, set it in `eas.json` (the submit
  profile already has `appleTeamId: 9VTP9D85PL`) or pass it to the plugin.
- The widget refreshes ~hourly on its own; the app also reloads it on every goal change.
- Android equivalent (App Widgets via `react-native-android-widget`) is the next step.
