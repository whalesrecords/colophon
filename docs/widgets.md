# iOS home-screen widgets

A WidgetKit bundle via [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets),
three widgets sharing one App Group extension:

- **Ma série de lecture** — daily goal ring + streak (`ColophonReadingWidget`).
- **Mon année de lecture** — books/pages this year + collection size (`ColophonStatsWidget`).
- **Où en es-tu ?** — the book you're reading, progress bar, `p. X/Y · Z%`, minutes today
  (`ColophonCurrentReadWidget`).

## How it works

- **`targets/widget/index.swift`** — the SwiftUI widgets. Each reads the shared App Group
  `UserDefaults(suiteName: "group.com.whalesrecords.colophon")`: `streak`/`today`/`goal`
  for the ring, `booksYear`/`pagesYear`/`collTotal` for stats, `cr_*` for the current read.
- **`targets/widget/expo-target.config.js`** — declares the widget extension target +
  its App Group entitlement.
- **`src/features/reading/widget-sync.ts`** — `syncReadingWidget()` / `syncStatsWidget()`
  / `syncCurrentReadWidget()` write those keys to the App Group and call
  `ExtensionStorage.reloadWidget()`. Called from `DailyGoalCard`, Profil, and `LibraryHome`
  respectively. **No-ops on web + Android** (the native module is absent there).
- **`app.json`** — the `@bacons/apple-targets` plugin + the app's App Group entitlement.

## Status: ACTIVE

The `@bacons/apple-targets` plugin + the App Group entitlement are wired in `app.json`,
and the widget bundle id `com.whalesrecords.colophon.widget` has a valid provisioning
profile (shipped in TestFlight build #40+). Headless `--non-interactive` builds work.

The original one-time hurdle (kept for history): a brand-new app extension needs its
**own provisioning profile**, which EAS can only create in **interactive** mode the
first time. That's done; the App Group + the widget bundle id are registered.

## Activating it (one interactive build, then headless works)

1. Re-add to `app.json`: the `@bacons/apple-targets` plugin, and under `ios` the
   `"entitlements": { "com.apple.security.application-groups": ["group.com.whalesrecords.colophon"] }`.
2. Run **one interactive build** to create the widget's provisioning profile:
   `EXPO_TOKEN=… npx eas-cli build -p ios --profile production` (no `--non-interactive`),
   and accept the credential prompts for the `ColophonLecture` target. After this,
   `--non-interactive` builds work again.
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
