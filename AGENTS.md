# Colophon

Personal library manager + reading tracker (a "Mangacollec for books"). Scan a
book's EAN-13 (= its ISBN-13), auto-fetch metadata via an API cascade, catalogue
what you own, and track your reading. One codebase → iOS + Android + Web.
**Destined for the App Store** (multi-user product, not a personal-only app).

> Expo SDK 56 is current here. Check the versioned docs
> (https://docs.expo.dev/versions/v56.0.0/) before writing Expo code.

## Stack
- **Expo SDK 56** + Expo Router (file-based) + TypeScript strict. React 19.2, RN 0.85.
- **React Native Web** for the web target (responsive desktop).
- **Tamagui** for styling (tokens + themes), built from the design handoff.
- **Supabase** (Postgres + Auth + Realtime + Storage + Edge Functions).
- **TanStack Query** + the Supabase client for data. No Redux.
- **pnpm** (with `node-linker=hoisted` in `.npmrc`, required for Metro/RN).
- Tests: **jest-expo** (jest 29 — jest-expo 56 requires v29, not v30).

## Supabase project
- Project ref: **`bwmhbnozduuoyavqkaha`** (name `colophon`, region eu-west-3).
- URL: `https://bwmhbnozduuoyavqkaha.supabase.co`. Public key in `.env`
  (`EXPO_PUBLIC_SUPABASE_ANON_KEY`, the `sb_publishable_...` key).
- Migrations + edge functions are managed via the **Supabase MCP** (mirrored in
  `supabase/migrations/` and `supabase/functions/` for source control).

## Architecture
```
src/app/                Expo Router routes
  _layout.tsx           providers (Tamagui, Query, SafeArea, Auth) + auth gate (Stack.Protected)
  (auth)/               login, sign-up  — shown when signed out
  (app)/                tabs: index (Bibliothèque), trends, scan, discussions, profile — signed in
src/lib/                supabase client, env, ISBN + parsers (pure, tested), generated db types
src/features/           auth/, library/  (data hooks + context)
src/components/         BookCover (hero), Screen, Field, icons, ...
src/theme/              tokens.ts (design tokens) + tamagui.config.ts + cover-palettes.ts
supabase/migrations/    SQL schema + RLS
supabase/functions/isbn-lookup/   Deno edge function (cascade lookup)
design/                 the high-fidelity handoff (reference, not shipped)
```

## Design
Brand: **"Les tranches"** (wabi-sabi). Calm chrome — **parchemin** `#F4EEE2` /
**nuit** `#221B14` surfaces, **Espresso** `#2A1E15` brand accent (nav, §, the
primary buttons) — and colour comes from the book covers + the four **tranches**:
brique `#AE4133` (romans/alertes), prusse `#225F77` (essais/en cours), forêt
`#2D6B4E` (séries/terminé), ocre `#B5832E` (mangas/BD/envies), each with on-dark
variants. The UI recedes so **book covers are the heroes**. Logo = `ColophonMark`
(SVG: pyramid of 4 slices on an espresso shelf + § medallion) — on login + the app
icon. Type: **Spectral** (serif, brand/titles) + **Schibsted Grotesk** (UI). All
tokens in `src/theme/tokens.ts` + the dark theme in `tamagui.config.ts`; legacy
token names are kept (`aizome`→espresso, `sage`→forêt, `terracotta`→brique,
`ochre`→gold) so components reskin without edits. UI language: French; code &
identifiers: English.

**UX/UI reference (apply by default):** follow `docs/guide-ux-ui.md` — a sourced
guide of platform standards (Apple HIG / Material 3 / WCAG 2.2), UX laws, the
science of ethical engagement, dark-pattern law, and legal/e-invoicing compliance.
Touch targets ≥ 44–48px, contrast ≥ 4.5:1, never colour-only, respect
`prefers-reduced-motion`, streaks never shame (grace day already implemented), zero
dark patterns. **Adaptive layout:** use `useBreakpoint()` (`src/theme/breakpoints.ts`,
Material window size classes) + `CONTENT_MAX` to centre content on tablet/desktop
instead of stretching. The library + book detail already centre to a max-width
column on wide screens.

**iPad / adaptive — next steps (proposed).** Foundation shipped (`useBreakpoint`,
centred content). Remaining, in order: (1) library **list-detail** on `isExpanded`
(≥840): master cover-grid on the left, book detail in a right pane instead of a full
push — reuse `book/[id]` content extracted into a component; (2) tablet **side
navigation rail** replacing the bottom tab bar on `isExpanded` (Material adaptive);
(3) denser default grid on tablet; (4) two-column reading/stats screens. Ship behind
`useBreakpoint()` so phone layout is untouched.

## Non-obvious facts (read before changing related code)
- **BnF SRU indexes ISBN-10**, not ISBN-13. Query `bib.isbn all "{isbn10}"`
  (convert 978-prefixed ISBN-13 → ISBN-10 first). 979-prefixed ISBNs have no
  ISBN-10 → BnF returns nothing, cascade falls through.
- **Google Books keyless** frequently returns HTTP 429; the cascade then falls
  through to Open Library (this is expected, not a bug). Set `GOOGLE_BOOKS_KEY`
  in the function's env to raise the quota.
- **Shared pure modules** (`isbn.ts`, `book.ts`, `book-parsers.ts`) are canonical
  in `src/lib/` and copied into the edge function by `pnpm sync:functions`
  (which also adds `.ts` import extensions — Deno requires them). Re-run it after
  editing those files, then redeploy the function.
- **Tamagui `Button`**: don't pass a React element to the `icon` prop (causes a
  "Converting circular structure to JSON" crash). Render the spinner/icon as a
  child instead.
- **`items.rating` is `numeric(2,1)`** (half-stars, per the design) — the spec
  said `int`; this is a deliberate deviation.
- **RLS** for `reading_sessions` and `item_shelves` is enforced via an `EXISTS`
  check on the parent `items` row (those tables have no `user_id`).
- **Email confirmation is ON.** A confirmed dev user exists:
  `test@colophon.app` / `colophon123` (created via SQL). **Remove it before
  production**, or disable email confirmation in Auth settings for local testing.

## Commands
- `pnpm web` / `pnpm ios` / `pnpm android` — run the app
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — jest
- `pnpm format` — prettier
- `pnpm sync:functions` — sync shared modules into the edge function bundle

## Roadmap
- **Phase 1 ✅** scaffold, auth, schema + RLS, `isbn-lookup` (deployed & tested).
- **Phase 2 ✅** scan (expo-camera burst, web zxing, manual ISBN), `book-search`
  (fielded title/author/publisher/theme search), lookup wired, add item.
- **Phase 3 ✅** library grid/list, faceted filters (funnel), sort, search, book
  detail (status, rating, notes, exemplaire), shelves CRUD + assign + facet.
- **Phase 4 ✅** reading sessions: start / page progress / finish, "Lus en {year}".
- **Phase 5 ✅** stats dashboard, sharing (public library/shelf link), account
  deletion (App Store req.), Tendances (community trends).
- **Social ✅** reading circles + realtime discussions (create/join by code,
  member list, live chat); sharing via `/s/[token]` public route.
- **Shipped since ✅** customizable tags; delete book; duplicate detection;
  dashboard Classement/Doublons/Prêtés; loans; **cover override + deep
  `cover-search`** (Google/OL/BnF/AniList, validated); **add-the-whole-series**
  (`useSeriesVolumes` + SeriesAddSheet); **CSV export**; **profiles + avatars**;
  **installable PWA + Mac** (Designed-for-iPad + PWA); **circle moderation**
  (report/block, App Store 1.2) + **anti comment-bombing** (a SECURITY DEFINER
  `enforce_comment_rate_limit` BEFORE-INSERT trigger on `messages` +
  `circle_book_comments`: ≥8 posts/10s or a 3rd identical body/30s is rejected);
  **i18n** (FR/EN switcher in Settings, FR fallback — tabs/auth/profile done so
  far); **dark mode** ("sumi ink" theme, Système/Clair/Sombre in Settings);
  **scan duplicate-alert** (flags already-owned at add); **real Goodreads/Babelio
  CSV import** (rating + status + review); **annual reading goal**
  (`profiles.annual_goal`, progress bar in Profil); **shareable year recap**
  ("Wrapped"-style YearRecap — books/pages/top author+genre); **series completion
  view** (missing tomes + bulk-add in the library series overlay); **profile bio**;
  **adversarial-review hardening** (series grouping requires 2+ distinct ISBNs so
  duplicate copies / same-title books don't form phantom series; X/Y counts
  distinct tomes not physical copies; exact series-key match — no spin-off bleed;
  shared `series` cache is read-only RLS, only service-role seeds it; scan AddSheet
  commits via a resolved path — no double lookup; BarcodeScanner `paused` while the
  sheet is open; owned-scoped duplicate badge; add-as-"Lu" no longer fabricates a
  today-dated finish); **"À venir" release calendar** (`useUpcoming` fans the deep
  book-search over owned series → future-dated volumes grouped by month + interior
  gaps in numbered series, 1-tap add to Envies; library-header entry point);
  **bilan rebuilt** (`useYearRecap`: books + approx pages + themes chips + top
  author + busiest month + 12-month rhythm + dated reading list; in a `<Modal>` —
  the old absolute overlay didn't display reliably); **EN i18n on the core screens**
  (147 keys across library/scan/book/upcoming/AddSheet/Filter/SeriesCompletion; FR
  source+fallback, `t()` is type-checked so every used key must exist); **animated
  login** (`BookPageTurn`: flat-design open book, looping page-turn via SVG + a
  setInterval/state loop — rAF doesn't tick under RNW here; replaces the 40 MB .mov);
  **profile bio editor**; **page-turning BookLoader** (the login book, shrunk, as
  the loading/search indicator in place of the spinner — library load, À venir
  scan, series-completion search, recap load, scan lookup); **editable reading
  dates** (per-session started_on/finished_on, e.g. dating a read from years ago);
  **bilan ratings/reviews** (avg stars, coups de cœur, least-liked, written
  reviews from `items.notes`); **"Ça traîne"** (books reading >60 days via
  started_on); **À venir made honest** (future-dated series volumes only, +
  favourite-authors discovery, + a clearly-separated "Compléter ma collection" for
  released gaps — open catalogues carry ~no forthcoming dates; a real release
  calendar needs a dedicated FR trade source like **Dilicom FEL**, the pro book-
  trade DB, since Google Books-with-key returns 0 future-dated manga volumes and
  manga-news blocks scraping); **circle agenda RSVP** (`circle_event_rsvps` +
  is_circle_member RLS, "Je viens/Peut-être/Non" + participant count) + **Google
  Calendar** add-event links per rendez-vous; **in-app message notifications**
  (`circle_members.last_read_at` + `circle_unread_counts`/`mark_circle_read` RPCs;
  unread badge on the Échanges tab + per circle, live via a message-insert realtime
  sub, cleared on opening a circle's chat — real OS push still needs a native build
  + APNs/FCM); **password reset** ("Mot de passe oublié ?" + public `/reset-password`
  recovery page); **reader discovery + friends** (`friendships` directed-request
  table + RLS; profiles now authenticated-SELECTable; `suggested_readers()` ranks
  other readers by shared-genre overlap, `reader_profile()` returns basics +
  aggregates + recent reads with no private notes; `/readers` discovery screen
  (from the Échanges header, incoming-request badge) + `/u/[id]` reader profile
  with an add/accept/friends friend-action button); **Tendances top-3** (Genres &
  Auteurs collapse to 3 with a "… voir N de plus" expander); **collection stats**
  (sum of owned `purchase_price` = collection value, # priced, books bought this
  year + amount spent — the MangaCollec-requested acquisition rhythm; columns
  purchase_price/date/store already existed + wired in book detail, now surfaced in
  a Profil "Collection" card shown only when prices are entered); **library UX pass**
  (`ux-ergonomie` skill): FilterPanel → compact accordion (one collapsible row per
  facet); header consolidated to "Filtres et tri" (sort moved into the sheet) +
  "Affichage" (Séries/size/grille-liste collapsible), Empruntés folded into the
  Possession facet → covers rise above the fold; **prioritized reading queue**
  (`items.queue_position` + `use-reading-queue`; the to-read pile splits into an
  ordered "Ma file" — prioritise/reorder ↑↓/remove — and the unordered "Pile à
  lire"; `/queue` screen reached from a library "À lire · N" chip); **push
  notifications foundation** (`push_tokens` table + RLS; `usePushRegistration`
  native-only hook upserts the Expo token; `send-push` edge function — verify_jwt
  off — resolves a circle's members + tokens and posts to the Expo Push API; a
  pg_net AFTER-INSERT trigger on `messages` calls it fire-and-forget. Verified:
  insert → trigger → 200 `{"sent":0}` until a native device registers a token.
  **Real delivery still needs a native EAS build + push credentials — APNs (iOS) /
  FCM (Android).**); **"Trouver chez un libraire"** (book detail link → leslibraires.fr
  search by ISBN/title — FR indie co-op, never Amazon; `bookshopUrl` helper);
  **friends' current reads** ("En ce moment" strip on Échanges — each friend's most
  recent in-progress read, cover + avatar, tap → their profile; opt-out via
  `profiles.share_current_reading` toggle in Profil → Confidentialité. RLS-safe
  `friends_current_reading()` SECURITY DEFINER RPC: only accepted friends who kept
  sharing on, one row per friend, no private notes).

## Roadmap — ownership-first (from the strategy dossier in `Etudes/`)
The dossier's thesis: own the **possession** axis (what a reader *has*) for ALL
books — the white space Goodreads/StoryGraph/Babelio leave open and Mangacollec
only fills for manga. Prioritized, grounded against what already ships:
- **P0.1 — possession axis, separate from reading status. v1 SHIPPED.**
  `items.ownership` (`owned`/`wishlist`/`borrowed`) + `borrowed_from` (additive,
  all existing rows → owned). Scan/manual/search single-add now opens an
  **AddSheet** ("Je le possède / Je le veux / Emprunté" + reading-status pills,
  possession en 1 tap); bulk paths stay sheet-free. Library has an ownership
  facet; the **default view hides the wishlist** (envies) — owned+borrowed only;
  wishlist/borrowed get a badge. **Stats exclude wishlist** (borrowed counts);
  duplicate detection scoped to owned; book detail has a Possession picker;
  CSV export gains a "Possession" column. **`format`** (Broché/Relié/Poche/
  Numérique/Audio) SHIPPED: `items.format`, book-detail picker, library facet,
  CSV "Format" column. Neutral **DNF** ("Pas fini") shipped too.
- **P0.2 — owned-vs-missing series completion view** ("14/22 — il manque T7, T12").
  **v1 SHIPPED**: tap a series stack in the library (group mode) → the overlay
  now fetches the full volume list (`useSeriesVolumes`), shows the **missing
  tomes** + "ajouter les N manquants" (`SeriesCompletion`). **X/Y badge DONE**: a
  shared `series` cache (`normalized_key`, `total_volumes`) is upserted whenever a
  series' volume list is fetched (`useSeriesTotals` reads it); the SeriesCard
  shows "X/Y" (green ✓ when complete). Lazy — a series gets its total the first
  time it's opened/added. Also: a library **Envies/Empruntés** quick-chip surfaces
  the otherwise-hidden wishlist.
- **P0.3 — first-class Wishlist (Envies)** — fed by manual add, scan "je le veux",
  missing series volumes, circle proposals. Low effort once P0.1 lands.
- **P1 — quick wins:** duplicate-alert AT SCAN (logic already exists); real
  Goodreads/Babelio CSV *import* (current import only takes a pasted ISBN list);
  release-calendar + new-volume alerts for followed series; mood/pace on the
  reading; flexible annual goal + shareable "Wrapped"; neutral DNF; `format`.
- **P2/P3 — bigger bets:** freemium (base cataloguing free forever); disable-able
  surfaces (modularity); WEMI Work level (group editions of one title);
  authors/subjects as authority entities (data.bnf.fr RAMEAU); anti-spoiler
  page-anchored buddy reads; FR indie-bookseller affiliation (never Amazon).

## Roadmap — Objectifs & engagement (gamification, proposed)
Thesis: turn cataloguing into a daily reading *habit* with light, sport-app-style
mechanics + social accountability — building on what ships (`profiles.annual_goal`,
`reading_sessions` page progress, circles, `friendships`, push foundation,
`circle_book_comments`). Keep it opt-in & non-anxiety-inducing (the dossier's
neutral-DNF / anti-pressure guardrail still holds — streaks must never shame).
- **P0 — daily goal + streak. v1 SHIPPED.** `profiles.daily_goal` (pages/day, default
  20) + a `daily_reading(user_id, day, pages)` rollup fed by the page-progress
  mutation (a `log_daily_pages(p_pages)` SECURITY DEFINER upsert credits the forward
  delta to today). `useDailyGoal` returns today's pages + a **streak** (consecutive
  days meeting the goal, ending today/yesterday so an in-progress day never breaks it,
  with one grace day so a single miss doesn't wipe months). `DailyGoalCard`
  (react-native-svg ring + 🔥 streak pill + 10/20/30/50 presets) is on Profil. **Next:
  a compact ring on Home + the daily reminder push.**
- **P0 — reminders.** Opt-in daily push ("il te reste 12 pages pour ta série du
  jour") via the existing push pipeline. **Needs FCM on Android** (see pending).
  Quiet hours + a single, gentle reminder (no spam).
- **iOS home-screen widget — SCAFFOLDED.** A WidgetKit widget ("Ma série de lecture":
  ring + 🔥 streak + today/goal) via `@bacons/apple-targets` — `targets/widget/` (Swift
  + target config), `widget-sync.ts` pushes the snapshot to the App Group
  `group.com.whalesrecords.colophon` and reloads the timeline (no-op on web/Android).
  **Activation needs an iOS build + the App Group capability — see `docs/widgets.md`.**
  Gotcha fixed: the target name must be sanitized (`ColophonLecture`, no spaces) +
  `ios.appleTeamId` is required, else prebuild won't generate the target. Build #36
  (1.0.0) shipped it to TestFlight. Android equivalent (`react-native-android-widget`)
  is still pending.
- **Widget suite (in progress).** A `WidgetBundle` (one App Group extension, multiple
  widget kinds). **Shipped:** "Ma série de lecture" (streak ring) + "Mon année de lecture"
  (`ColophonStatsWidget` — books/pages this year + collection size, fed by `syncStatsWidget`
  from Profil) + **"Où en es-tu ?"** (`ColophonCurrentReadWidget` — current book + progress
  bar + `p. X/Y · Z%` + minutes today, fed by `syncCurrentReadWidget` from `LibraryHome`)
  + **"Mes badges"** (`ColophonBadgesWidget` — N/M + the 3 highest-tier earned badges with
  SF Symbols, fed by `syncBadgesWidget` from `BadgesCard`; à la Santé). Widget emoji
  swapped for SF Symbols (`flame.fill`). **Next kinds:** **challenge** progress,
  **rendez-vous** (circle agenda), a **circle** + its **unread discussions**, and
  a **map** mini (nearest book box / reading place). Each reads a snapshot pushed to
  the App Group via `widget-sync` (extend the payload). Could use WidgetKit
  configuration intents so one widget exposes several "kinds".
- **Séance de lecture « au calme ». SHIPPED (in-app).** A distraction-free dark
  full-screen reading session (`/session`, `colophon://session`): pick a book → big
  timestamp chrono (Démarrer/Pause/Reprendre) → "Terminer · +N min" logs minutes → an
  "Où en es-tu ?" page-marking step. Entry: "Lire au calme" in book detail + the
  "Où en es-tu ?" widget's `widgetURL`. Verified end-to-end on web.
- **Interactive reading chrono à la Santé — Live Activity (planned, native).** The Lock
  Screen + Dynamic Island running-timer layer on top of the calm session: ActivityKit +
  App Intents + a phone-side bridge (`expo-live-activity` or a custom module). Full plan
  + scaffold code in `docs/live-activity.md`. Big native effort, needs a device to validate.
- **DailyGoalCard redesign (SHIPPED).** Month as a real calendar grid (7 cols, Monday-first,
  day 1 offset to its weekday) + a horizontal "cette semaine" strip; numbers unified to the
  sans UI font (no more serif/sans clash in the goal figure).
- **Reading chronometer + reading-TIME tracking. SHIPPED (phone/web).** `reading_sessions.minutes`
  + `daily_reading.minutes` + a `log_reading_minutes(p_session, p_minutes)` SECURITY DEFINER
  RPC (mirrors `record_reading_page`: ownership via the parent item, credits the session +
  today's rollup). `ReadingTimer` card in book detail (`ReadingSection`) — a timestamp-based
  stopwatch (Démarrer/Pause/Reprendre/Terminer), on "Terminer · +N min" it logs the rounded
  minutes. `useDailyGoal` now also returns `minutesToday`. Verified end-to-end on web (RPC
  syncs session + daily minutes). **Next:** surface minutes in the bilan / daily goal card;
  a reading-pace (pages-per-hour) stat.
- **watchOS companion app. SCAFFOLDED (disabled).** `targets/watch/` (`@bacons/apple-targets`
  type `watch`): a SwiftUI watch app — two paged screens, "Où en es-tu ?" (current read +
  progress + −/+ page bump) and "Chrono" (reading stopwatch). A `WatchData` `WCSessionDelegate`
  receives the current-read snapshot from the phone and relays logs (minutes/page) back.
  **Config kept inert** (`expo-target.config.js.disabled`) so the `targets/*` glob doesn't
  break non-interactive builds (a new app target needs one interactive provisioning build,
  like the widget did). **Remaining to wire data:** a phone-side `WCSession` bridge (native
  module) — RN has no WCSession; the JS half already writes the `cr_*` snapshot to the App
  Group. Full activation + message protocol in `docs/watch.md`. Until then the watch runs as
  a standalone chronometer.
- **Mascottes (design).** `design/` references (`MASCOTTES-CHALLENGE.svg` = le marque-page
  + la tour de tomes, 3 états chacun) drive the widget/challenge art. Proposed extras:
  la pousse (série, anti-pression), le médaillon § (badges), l'escargot (lecture lente).
  **La tasse "session" se décline par genre** (`MASCOTTE-TASSE-VARIANTES.svg`): espresso
  (défaut) · tasse anglaise (romance/historique, Bridgerton) · gros mug (thriller/SF US) ·
  yunomi (manga/litt. japonaise) · tasse rose (feel-good/girly) · bol (classiques FR/BD).
  Mapping `cupForGenre(genre)` à implémenter quand la tasse est intégrée (widget Swift ou
  une déco "En ce moment" — exposerait alors le genre du livre en cours).
- **P1 — bonuses, étoiles & badges. v1 SHIPPED (computed).** `features/profile/badges.ts`
  defines a catalogue (collection size, books finished, pages, breadth, streak tiers)
  evaluated on the fly from the stats we already have — `BadgesCard` on Profil shows
  earned (gold ring) vs locked (dimmed + progress), "N/M". **Next:** persist + celebrate
  the moment one is earned, surface on the widget / public profile, add stars/XP +
  cosmetic flair (never pay-to-win) via `achievements` + `user_achievements` tables.
  **Critique/Chroniqueur badges added** (10/25 avis écrits — `items.notes` count via a
  new `reviews` stat), the reward for the avis nudge below.
- **Engagement nudges (in-app prompts). v1 SHIPPED.** Gentle, snooze/skip-persisted
  cards built to the UX brief (one question, big targets, escapable, never shames):
  `ReadingNudge` (Home — rate a finished book's fiche, warm reward + Critique-badge
  carrot; `use-reading-nudge` = read+unrated+owned, `useSnooze` cooldowns);
  `LibrairieNudge` (Home footer — indie bookshop near you, geoloc → Maps/`leslibraires`);
  `CercleNudge` + `CafeNudge` (Échanges — a circle by your top genre, and reading
  meet-ups near you). Honest handoffs where the app has no dataset (geoloc → Maps
  search). Reusable `features/engagement/use-snooze.ts`.
- **P1 — leaderboards vs friends & circles. v1 SHIPPED.** Weekly-pages ranking (sum of
  `daily_reading` over the last 7 days) scoped to friends or a circle, via `SECURITY
  DEFINER` RPCs `friends_leaderboard()` (me + accepted friends) and
  `circle_leaderboard(p_circle)` (members only, `is_circle_member` gate) — RLS-safe,
  aggregate pages only. `Leaderboard` component (rank medals, avatar, pages bar, "Toi"
  highlighted): a "Classement · cette semaine" card on Échanges + a "Classement" tab
  inside each circle. **Next:** streak-based ranking too; a per-stat privacy toggle;
  time-boxed challenges on top.
- **P1 — challenges. v1 SHIPPED (circle-scoped).** Time-boxed, sport-app-style
  ("500 pages cette semaine", "un tome par jour"): `challenges` + `challenge_participants`
  (RLS via `is_circle_member`); a **"Défis" tab** in each circle — create (titre, Pages/
  Livres, objectif, 7/14/30 j), Rejoindre/Quitter (creator auto-joins), live ranking via
  `challenge_progress(p_challenge)` (pages from `daily_reading` or books finished in the
  window, target bar + ✓ when reached). **Winner SHIPPED:** ended challenges move to a
  "Défis terminés" section with a 🏆 winner banner (green "Tu remportes ce défi !" when it's
  you) + final ranking. **Next:** friends-scoped challenges, tie-in to badges/celebration.
- **P2 — reading feed + follow. v1 SHIPPED.** One-way **follow** (`follows(follower_id,
  followee_id)`, RLS self-scoped) — a "Suivre/Suivi ✓" button on `/u/[id]`. A **`/feed`
  screen** ("Ce que lit ton réseau", reached from the Échanges header "Fil" chip) lists
  books recently **finished by people you follow** (cover, title, ★ rating, date) via the
  `reading_feed()` SECURITY DEFINER RPC. **Mini-reviews SHIPPED:** `items.review_shared`
  opt-in (a "Partager mon avis dans le fil" toggle under the review in book detail) surfaces
  the written review (`items.notes`) as an italic quote in the feed entry. **Follower count
  SHIPPED** (`follow_counts()` RPC → an "abonnés" stat on `/u/[id]`). **Next:** winner→badge
  tie-in; merge in friends' activity; free-standing posts (not tied to a finished book).

## Roadmap — revente, dons & valeur de revente
Own the *exit* of possession too: help a reader resell, give, or buy second-hand —
and surface what their collection is worth now (not just what it cost).
- **v1 SHIPPED — per-book "Revendre ou donner".** Book detail links out to **momox**
  (rachat instantané, price *by condition* once you enter the ISBN — the v1 answer to
  "prix approximatif selon l'état"), **Vinted** & **Leboncoin** (title search → cote +
  sell/give-away listing). `src/lib/marketplace.ts`, deep links (no public APIs).
- **Marketplace space.** A dedicated section listing your *sellable/donnable* books
  (duplicates, finished, low-rated, "ça traîne") with one-tap list-to-sell and a bulk
  **momox lot** (rachat groupé). Reuses duplicate detection + ratings already shipped.
- **Auto price-by-condition.** Add `items.condition` (neuf/très bon/bon/correct/abîmé)
  + `estimated_value`; auto-fetch resale price by ISBN+condition. Needs a real pricing
  source — **momox partner API** (gives price-by-condition), ISBNdb (paid, deferred),
  or comps scraping (fragile/ToS). Until then, manual value entry feeds the same field.
- **Resale value in the library. v1 SHIPPED.** `items.estimated_value` (manual entry in
  book detail, "Valeur de revente estimée"); `use-stats` sums it over owned copies
  (`resaleValue`/`resaleCount`); the Profil **Collection** card gains a gold "Revente · N
  chiffrés" row — "ce que ça vaut aujourd'hui" vs "ce que ça a coûté" (`purchase_price`).
  Auto price-by-condition (momox API) still pending; manual entry feeds the same field.
- **Dons.** A clear "donner" path (Leboncoin *donnons* / Recyclivre / Emmaüs) for books
  you won't resell — aligned with the indie/never-Amazon ethos.
- **Boîtes à livres (little free libraries) — v1 SHIPPED.** A community map of book
  boxes: any reader signals one (`book_boxes`: name, lat/lng, city, photo in the
  `book-boxes` storage bucket, note) and logs the books they've dropped there
  (`book_box_donations`). RLS: authenticated read-all, owner-write. Screen `/boites`
  (reached from the carte header) — browse with photo + donation count, add a box
  (photo + "📍 ma position" geolocation + note), open a box → "Y aller" + drop-a-book
  log. **Pins on the carte SHIPPED (web)**: a 📚 square gold marker layer fetched from
  `book_boxes` + a "Boîtes à livres" filter toggle; tap a pin → popup (photo, note,
  "Y aller"). **Next: native-map parity** (the native WebView map needs the boxes
  passed in) + "ajouter ici" by tapping a map point. Carte refonte also done: warm
  pastille clusters + tranche filter pills.

## Roadmap — onboarding, découverte, confidentialité & sécurité (proposed)
- **Chemin de lecteur à l'inscription (P1).** First-run persona pick — **Collectionneur**
  (possession-first home), **Social** (sharing + discovery on), **Secret** (private by
  default). Sets the privacy defaults below and tailors the first screen.
- **Découverte sémantique (P1). SHIPPED — LLM engine.** The `reader-taste` edge function
  (Claude Haiku, needs the `ANTHROPIC_API_KEY` secret — read with a hyphen-tolerant fallback)
  reads the user's library → **taste clusters** (semantic universes) + **"Dans ton style"
  recommendations**: new series in the same vein (NOT owned, 1 per series, varied universes),
  each with an affinity **`match` %** + the owned titles it's **`related`** to, resolved to a
  **FRENCH edition** (Google `langRestrict=fr`, two-pass: prefer `language==='fr'` for a FR
  résumé, fall back to any). Cached in `reader_taste` (recompute on library change / >14d;
  `#vN` hash suffix busts the cache on schema bumps). Client: `useReaderTaste` →
  `RecommendationsShelf` (home, match % badge) + `TasteProfileCard` (Profil — **stacked
  tranche bars**, book-spine/logo style) + `/discover/[isbn]` (résumé up top, **% pour toi**,
  **community rating** via `book_community_rating(isbn)`, **En lien avec tes lectures** chips,
  the LLM's `why`). Share: `taste-share` (canvas poster / native text) + `ShareProfileSheet`
  ("Partager l'image" + "Poster dans un cercle"). **Next:** ask the LLM for more candidates
  (rec count varies 3–6 as Google lacks a FR edition+cover for some); prefer volume 1; embeddings
  + pgvector when the catalog is large enough (cheaper at scale than per-user LLM calls).
- **Library prefs persisted (SHIPPED).** `useLibraryPrefs` (AsyncStorage) keeps view/size/
  series-grouping/sort/filters across navigation + restarts.
- **Recommandations par humeur (P2, façon StoryGraph).** mood/pace tags on books; "envie de
  quoi ce soir ?" → suggestions filtered by mood.
- **Modes de confidentialité (P0). v1 SHIPPED.** `profiles.is_private` + a master **Secret ⇄
  Social** control in Profil → Confidentialité (picking Secret also forces
  `share_current_reading=false`). Secret = excluded from every social surface — gated in
  `suggested_readers` (discovery), `reader_profile` (profile returns null to others),
  `friends_current_reading` ("En ce moment"), `reading_feed` (followers' feed),
  `friends_leaderboard` + `circle_leaderboard` (self still visible to self). Verified
  cross-user on web: a private reader vanishes from the feed + their profile is "introuvable".
  **Next:** per-surface granular toggles beyond the master switch; tie into the onboarding persona.
- **Récap hebdo par email (P1).** Opt-in weekly reading summary, emailed automatically — an
  edge function on a `pg_cron` schedule + an email provider (Resend). Quiet, gentle, opt-out.
- **Sécurité ULTRA (P0, transverse). Audit pass DONE.** Supabase security advisor run +
  acted on: **all public tables have RLS** (no `rls_disabled` findings); the 3 trigger
  functions (`handle_new_user`/`notify_new_message`/`enforce_comment_rate_limit`) were
  inadvertently anon-callable via `/rest/v1/rpc/*` → **EXECUTE revoked**; secret scan clean
  (`.env` gitignored, no service-role key committed, only the publishable anon key client-
  side, service role only inside edge functions). Privacy modes (`is_private`) shipped.
  **Accepted/low-risk:** public bucket listing on `avatars`/`book-boxes` (dropping the read
  policy broke image display; kept) — only reveals which user-ids have an avatar. **Still
  pending (YOUR dashboard action):** enable Auth **leaked-password protection**
  (HaveIBeenPwned). **Follow-up:** add a shared-secret header to `send-push` (currently
  `verify_jwt` off → theoretically spammable with a valid circle id); move `pg_net` out of
  the `public` schema.

## Roadmap — Colophon Pro (face libraires, B2B two-sided, proposed)
Turn Colophon from a reader app into a **two-sided platform**: a paid **Colophon Pro**
tier for independent bookshops. The reframe: Amazon wins because it owns **demand data +
discovery**; indies don't. **Colophon can be the demand-side layer indies never had — the
anti-Amazon** (exactly the dossier's positioning, now with a product to sell to shops, not
just an affiliation link). It also **turns the honest handoffs already shipped into real
in-app data** (`LibrairieNudge`/`CafeNudge` → Maps, the release calendar → Dilicom): once
shops are on Pro, those point at real bookshops/events/stock.
- **What the libraire gets:** (1) **their carte pin** — claimed, verified, editable (hours,
  photo, specialties, "coup de cœur du libraire"); (2) **sorties · agenda · événements**
  (signings, café-philo, clubs) → feeds reader-side "À venir" + `CafeNudge`; (3) **featured
  placement ("en avant")** — Pro ranks first in the librairie nudge, the carte, "trouver
  chez un libraire" (the monetizable scarcity); (4) **local demand signals** — *"42 readers
  near you want vol. 7 of X"* (the buying intel indies lack) — **aggregate, opt-in, anonymous
  ONLY**; (5) **talk to the fan base** — reuse the reader *follow* → "suivre cette librairie"
  + post events/coups de cœur to followers (opt-in, no spam); (6) **sell** — reserve /
  click-and-collect / order. **Physical goods are exempt from Apple IAP** → no 30% cut on
  book sales (big for the model).
- **Economic model:** **SaaS monthly subscription** (NOT a cut of sales — don't rob the
  indie's thin margins; matches the ethic). **Claiming a pin = free** (seeds side B risk-free);
  **Pro = paid** (featured + insights + comms + sell). The circle freemium already provides
  the billing muscle.
- **RED LINE (non-negotiable):** the dossier's **"pas de revente de données"** holds. Demand
  insights are **aggregated (cohorts ≥ N), opt-in, anonymous** — never individual, never
  "M. Untel's purchases". Reader opts into *"contribuer aux tendances locales (anonyme)"*.
  This is founding, not optional (brand + RGPD).
- **Hard parts:** two-sided cold start (poule/œuf) → seed with the existing reader base,
  pilot 2-3 indies in one city, channel via the **leslibraires co-op (~1200 shops)**;
  **verification** (SIRET + pro email, anti-squat); **sorties/agenda data** manual first →
  **Dilicom FEL** at scale; **payments/ops** → v1 = reserve/click-and-collect (pay in shop),
  sidesteps returns; **B2B support** (onboarding, billing) is a different muscle.
- **Phasing:** **v0 — Claim & appear** (editable carte profile + events, free — immediately
  upgrades the librairie/café nudges) → **v1 — Pro featured + follow + post-to-followers**
  (first revenue) → **v2 — aggregate/opt-in local demand insights** → **v3 — reserve/sell**
  (click-collect → payment).

## Roadmap — Envies partagées & listes de cadeaux (proposed)
Turn the **Wishlist (Envies)** into a **shareable gift list** — a wedding-registry-style
list to send friends/family for Noël/anniversaires. Built on what already ships: the public
`/s/[token]` route + `shared-library` edge function, `items.ownership='wishlist'`, and
`bookshopUrl` (indie purchase links).
- **Killer mechanic — the claim ("je l'offre"):** a gift-giver marks a book → it goes
  *réservé* for everyone else (**anti-double-gift**), and it's **surprise-preserving** (the
  owner doesn't see who claimed, at most a "X left" count). Anonymous claim, **no account
  needed** (optional email to notify the giver). This is what turns "a shared list" into a
  product people actually send.
- **Checkout destinations, indie-first (the ethos) — the reader's own ranking:** 🥇 **la
  librairie du coin** (reserve / click-and-collect) — the grail, via **Colophon Pro**; 🥈
  **leslibraires.fr** (co-op) — available now, `bookshopUrl` per book; 🥉 **library borrow**
  — honest handoff (no unified FR availability API → a "chercher en bibliothèque" search
  link, not real-time stock); ❌ **never Amazon** (brand + indie-affiliation revenue; the
  user's own instinct already ranks it last).
- **Technical honesty — the "panier":** no cross-retailer multi-book cart has a public URL
  (leslibraires exposes no cart-builder), so v1 = **per-book "Offrir"** + a "tout chez
  leslibraires" search; a real **unified basket exists only when a Pro bookshop takes the
  order** (Colophon Pro v3).
- **Phasing:** **v1** — shareable gift list (`/s/[token]` gift mode) + per-book "Offrir chez
  un libraire indé" + **anonymous anti-double-gift claim** → **v2** — reserve at the local
  shop (Colophon Pro) + library-borrow handoff. Privacy: claim data separate from the owner's
  view (surprise), anonymous givers, RLS-safe.

## Retours terrain — bugs & demandes (à traiter, non fait)
From a tester's Android phone (do NOT confuse with any shipped feature — these are open):
- **DEMANDE — suppression de compte : plus de friction.** Aujourd'hui « Supprimer le compte »
  (Réglages → DangerZone) ouvre déjà une **confirmation** (Alert / window.confirm), donc ce
  n'est pas « un petit clic ». La testeuse veut plus dur → ajouter une **confirmation typée**
  (taper « SUPPRIMER » pour activer), façon GitHub. Petit, App-Store-friendly.
- **DEMANDE — voir OÙ est un emplacement quand on l'ajoute.** À l'ajout d'une **boîte à livres**
  (`boites.tsx`, section « Emplacement » + « Utiliser ma position »), on ne voit pas où le point
  tombe → ajouter un **mini-plan / une adresse** confirmant la position choisie (reverse-geocode
  léger ou un aperçu de carte centré). (Ambigu : pourrait aussi viser le champ texte
  `EMPLACEMENT` de l'exemplaire — mais là c'est du texte libre, rien à « voir ».)
- **TODO demain — la page cadeau `/g/[token]` "ne fonctionne pas" sur le web déployé.**
  Le lien `colophon-three.vercel.app/g/<token>` sert bien le shell de l'app (200) mais la
  page ne rend pas. Cause la plus probable : **le déploiement Vercel n'a pas encore le bundle
  avec la route `/g`** (poussée sur `main` aujourd'hui) → **redéployer le web depuis `main`**
  puis vérifier `/g/[token]`. Vérifier aussi le rewrite Expo-Router des routes dynamiques sur
  Vercel (comme `/s/[token]`) et que les RPC `gift_*` répondent bien en prod (anon). Le
  backend + le token sont OK (testés : 7 livres) — c'est un souci de **déploiement web**, pas
  de code app.
- **BUG — Android : les flèches de retour ne fonctionnent pas.** Sur le téléphone d'une
  testeuse (Android), les petites flèches « retour en arrière » (le `‹` custom des en-têtes /
  `BackLink`) ne réagissent pas. À investiguer : le `Pressable`+`router.back()` des headers
  custom peut ne pas déclencher sur Android, et/ou le **bouton retour matériel Android** n'est
  pas géré (BackHandler / `router.back()`), notamment sur les overlays/modals (session, carte,
  boîtes, réglages, /g, /s). Vérifier le retour sur **tous** les écrans poussés + le geste de
  retour (predictiveBackGestureEnabled est à false).
- **DEMANDE — chat des cercles : éditer / supprimer ses messages + réactions.** Une testeuse
  veut pouvoir **éditer** et **supprimer** ses propres messages, et **réagir** (like / émojis)
  à ceux des autres. À faire : `messages.edited_at` + soft-delete (RLS: auteur only) + un
  éditeur inline ; une table `message_reactions` (message_id, user_id, emoji) + un sélecteur
  d'émojis + le compteur de réactions sous chaque message (live via la sub réaliste existante).
  S'applique aussi aux `circle_book_comments`.
- **DEMANDE — Pile à lire : proposer les prochains tomes d'une série commencée.** Quand une
  série est entamée (des tomes possédés/lus), surfacer dans la **Pile à lire** les **tomes
  suivants** : d'abord ceux **déjà possédés non lus** (à lire ensuite), puis les **manquants**
  (à ajouter aux envies / acheter). Briques déjà là : `use-series-volumes` (liste complète des
  tomes), `SeriesCompletion` (manquants + ajout groupé), `use-upcoming` (sorties futures),
  `use-reading-queue` + `PileShelf`. À faire : détecter le prochain tome non lu par série dans
  la pile et l'afficher (« Suite de {série} : T{n} »), 1-tap pour l'ajouter/le mettre en file.

## Edge functions (all deployed)
- `isbn-lookup` (public) — cascade Google Books → Open Library → BnF.
- `book-search` (public) — fielded search, Open Library primary.
- `shared-library` (public, service role) — returns a shared library/shelf by
  token for the anonymous `/s/[token]` page.
- `delete-account` (`verify_jwt`) — identifies caller from JWT, deletes the auth
  user via service role; FK cascades wipe their data.

## More non-obvious facts
- **Circle RLS avoids recursion** via `is_circle_member(circle_id, uid)`, a
  `SECURITY DEFINER` function (bypasses RLS, so membership policies don't
  self-reference). `create_circle` / `join_circle` are `SECURITY DEFINER` RPCs so
  a user can join by invite code without prior read access. All four + the
  `community_trends` RPC are `EXECUTE`-revoked from `anon`/`public`, granted to
  `authenticated` only. `authenticated` MUST keep `EXECUTE` on `is_circle_member`
  (RLS policies evaluate it under that role).
- **Share links** use `EXPO_PUBLIC_WEB_URL` as the base, falling back to
  `window.location.origin` on web. Set it to the Vercel domain for native shares.
- **Pending (dashboard toggles, not code):** enable Auth "leaked password
  protection" (HaveIBeenPwned); set `GOOGLE_BOOKS_KEY` to raise lookup quota;
  **Auth → URL Configuration**: (a) set **Site URL** to
  `https://colophon-three.vercel.app` (it still defaults to `http://localhost:3000`,
  so email-confirmation + reset links die on a phone), and (b) add
  `https://colophon-three.vercel.app/**` to **Redirect URLs**. Sign-up now passes
  `emailRedirectTo` (and reset passes `redirectTo`) via `authRedirectBase()` in
  `auth-context.tsx`, but Supabase only honours those if the URL is allow-listed —
  otherwise it falls back to the Site URL. Not done yet ⇒ confirmation links 404 on
  `localhost:3000`. (A future native build can deep-link `colophon://` for in-app
  confirmation; would also need `colophon://**` allow-listed.)
- **Android push needs FCM credentials.** The app now creates the `default`
  notification channel + a foreground handler, and `send-push` sets
  `channelId/priority`; but Expo push to Android still REQUIRES an FCM V1 service
  account uploaded to EAS (`eas credentials` → Android → Push Notifications, from a
  Firebase project). Without it, Android delivers nothing even when permission is
  granted. iOS needs the APNs key (already set during a prior TestFlight build).
- **Year-recap "Wrapped" share** (`features/stats/wrapped-share[.web].ts`): web
  draws a vertical Colophon-coloured poster on a `<canvas>` → PNG image + animated
  WebM video (MediaRecorder). Native falls back to a text share (a future native
  build can add view-shot/Skia to render the same poster).
- **Phase 6 (later)** offline-first via expo-sqlite + PowerSync.
