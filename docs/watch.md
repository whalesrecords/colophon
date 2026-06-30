# Apple Watch app — "Colophon au poignet"

A watchOS companion app via [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets):
see where you're at in your current book, run a reading **chronometer**, and bump the
page — all from the wrist. Built on the same reading-time data as the phone
(`reading_sessions.minutes` + `daily_reading.minutes`, fed by `log_reading_minutes`).

## What ships in the scaffold

- **`targets/watch/index.swift`** — the SwiftUI watch app. Two paged screens:
  - **Où en es-tu ?** — current book title + author, a progress bar, `p. X/Y · Z%`,
    minutes read today, and −/+ page bump buttons.
  - **Chrono** — a reading stopwatch (Démarrer / Pause / Reprendre / Fin). On "Fin" it
    credits the rounded minutes back to the phone.
  - A `WatchData` `WCSessionDelegate` receives the current-read snapshot from the phone
    and relays reading logs (minutes, page) back to it. Caches the last snapshot in the
    App Group so it shows something while the phone is unreachable.
- **`targets/watch/Info.plist`** — `WKApplication` + `WKCompanionAppBundleIdentifier`
  pointing at the iOS app (`com.whalesrecords.colophon`).
- **`targets/watch/expo-target.config.js.disabled`** — the target declaration, **inert
  by design** (see below).

## ⚠️ Status: code ready, target DISABLED until one interactive build

The config file is named `expo-target.config.js.disabled` so the plugin's `targets/*`
glob does **not** pick it up. Reason: a brand-new app target (the watch app) needs its
own **provisioning profile**, which EAS can only create in **interactive** mode the
first time — a routine `--non-interactive` build would fail (the widget hit this exact
wall). Keeping it inert means day-to-day builds stay green.

## The missing link: the phone-side WatchConnectivity bridge

The watch talks over `WCSession`. The **iOS app must answer** — React Native has no
`WCSession` by default, so data won't move until a small native bridge exists. The JS
layer already does its half: `syncCurrentReadWidget()` (in
`src/features/reading/widget-sync.ts`) writes the `cr_*` snapshot keys to the App Group
on every home render. The bridge just has to relay them.

Phone-side bridge to add (a local Expo module or an AppDelegate subscriber):

1. Activate a `WCSession` with a delegate on app start.
2. On `daily-goal` / current-read change, call
   `WCSession.default.updateApplicationContext([...])` with the same keys
   `syncCurrentReadWidget` writes (`cr_active`, `cr_title`, `cr_author`, `cr_page`,
   `cr_total`, `cr_pct`, `cr_minutesToday`) plus `goal`, `today`, `streak`.
3. Implement `didReceiveMessage` / `didReceiveApplicationContext` and map the watch's
   messages to Supabase:
   - `{ "type": "minutes", "minutes": N }` → `supabase.rpc('log_reading_minutes', { p_session, p_minutes: N })`
   - `{ "type": "page", "page": N }` → `supabase.rpc('record_reading_page', { p_session, p_page: N })`

   (the bridge needs the **open session id** — pass it down in the application context
   too, e.g. a `cr_session` key, so the watch can echo it back.)

Until the bridge lands, the watch app still runs as a **standalone chronometer** — it
just shows placeholder/last-cached book info and its logs don't reach Supabase.

## Activating it (one interactive build, then headless works)

1. `mv targets/watch/expo-target.config.js.disabled targets/watch/expo-target.config.js`
2. Make sure the App Group `group.com.whalesrecords.colophon` exists in the Apple
   Developer portal and is enabled on the app id + the new watch id
   (`com.whalesrecords.colophon.watch`). EAS usually registers the id automatically.
3. One **interactive** build to create the watch provisioning profile:
   `EXPO_TOKEN=… npx eas-cli build -p ios --profile production` (no `--non-interactive`),
   accepting the credential prompts for the `ColophonWatch` target.
4. After that, `--non-interactive --auto-submit` builds work again → TestFlight.
5. On the watch: it installs alongside the phone app (or via Watch app → Available Apps).

## Gotchas

- `appleTeamId` (`9VTP9D85PL`) must stay in `app.json` `ios` — prebuild won't generate
  the target without it (same as the widget).
- Bundle id defaults to `com.whalesrecords.colophon.watch`; `WKCompanionAppBundleIdentifier`
  in Info.plist must equal the iOS app id exactly.
- watchOS deployment target is set to 9.0 in the config; raise it if you adopt newer
  SwiftUI APIs.
