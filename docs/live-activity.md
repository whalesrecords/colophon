# Reading Live Activity — "le chrono à la Santé" (plan)

Goal: launch a reading session from a widget (or the in-app "Lire au calme" screen)
and have a **running timer on the Lock Screen + Dynamic Island** — like Apple Fitness /
a timer. "Terminer" ends it and prompts for the page. This is the native layer on top
of the already-shipped in-app calm session (`src/app/(app)/session.tsx`) + the chrono
data (`reading_sessions.minutes`, `log_reading_minutes`).

## What already exists (no native build needed)

- **In-app calm session** — `colophon://session` (`/session` route): pick a book, run a
  timestamp-based chrono, then mark the page. The "Où en es-tu ?" widget already
  `widgetURL`s here.
- **Reading-time data** — `log_reading_minutes(p_session, p_minutes)` +
  `record_reading_page`. The Live Activity just needs to call these on end.

## The native pieces to add

1. **`NSSupportsLiveActivities` = true** in the app Info.plist (via app.json
   `ios.infoPlist`).
2. **`ActivityAttributes`** — shared type describing the activity, compiled into BOTH
   the app and the widget extension (a shared Swift file):
   ```swift
   struct ReadingActivityAttributes: ActivityAttributes {
     struct ContentState: Codable, Hashable {
       var startedAt: Date     // for a self-updating timer via Text(timerInterval:)
       var page: Int
       var totalPages: Int
     }
     var title: String
     var author: String
   }
   ```
3. **A Live Activity widget** in the bundle (`targets/widget/`), alongside the existing
   `StaticConfiguration`s:
   ```swift
   struct ReadingLiveActivity: Widget {
     var body: some WidgetConfiguration {
       ActivityConfiguration(for: ReadingActivityAttributes.self) { ctx in
         // Lock Screen / banner
         HStack {
           VStack(alignment: .leading) {
             Text(ctx.attributes.title).font(.headline)
             Text(ctx.attributes.author).font(.caption).foregroundColor(.secondary)
           }
           Spacer()
           Text(timerInterval: ctx.state.startedAt...Date.distantFuture, countsDown: false)
             .monospacedDigit().font(.title2)
         }.padding()
       } dynamicIsland: { ctx in
         DynamicIsland {
           DynamicIslandExpandedRegion(.leading) { Text(ctx.attributes.title).lineLimit(1) }
           DynamicIslandExpandedRegion(.trailing) {
             Text(timerInterval: ctx.state.startedAt...Date.distantFuture, countsDown: false)
               .monospacedDigit()
           }
         } compactLeading: { Image(systemName: "book.fill") }
           compactTrailing: { Text(timerInterval: ctx.state.startedAt...Date.distantFuture, countsDown: false).monospacedDigit() }
           minimal: { Image(systemName: "book.fill") }
       }
     }
   }
   ```
   `Text(timerInterval:)` ticks on its own — no timeline updates needed while running.
4. **App Intents** for the interactive buttons ("Terminer", "+10 p") — iOS 17+ `AppIntent`
   conforming actions that the widget/Live Activity buttons trigger; each maps to the
   Supabase RPCs.
5. **A phone-side bridge** — RN has no ActivityKit. Either:
   - `expo-live-activity` (community module), or
   - a small custom Expo module exposing `start(attrs)`, `update(state)`, `end()` to JS.

   Then `src/app/(app)/session.tsx` calls `start()` on Démarrer, `update()` on page
   changes, `end()` on Terminer (right where it already calls `logMinutes` / `setPage`).

## Activation order

1. Add `NSSupportsLiveActivities` + the bridge module/plugin.
2. Drop the shared `ActivityAttributes` + `ReadingLiveActivity` into the widget target
   and register it in the `WidgetBundle`.
3. One interactive iOS build (new capability) → then headless builds work.
4. Wire `session.tsx` to start/update/end the activity.

Until then, the in-app calm session covers the experience on-screen; the Live Activity
adds the Lock-Screen / Dynamic-Island presence.
