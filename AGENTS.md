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
Direction: **wabi-sabi / Japanese-Mediterranean** — warm paper, ink, polished
concrete, indigo **aizome** accent. The UI recedes so **book covers are the
heroes**. All tokens (colours, Spectral + Schibsted Grotesk type, spacing, radii,
shadows) live in `src/theme/tokens.ts`, transcribed from
`design/design_handoff_colophon_mobile/README.md`. UI language: French; code &
identifiers: English.

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
  **profile bio editor**.

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
  protection" (HaveIBeenPwned); set `GOOGLE_BOOKS_KEY` to raise lookup quota.
- **Phase 6 (later)** offline-first via expo-sqlite + PowerSync.
