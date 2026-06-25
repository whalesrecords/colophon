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
- **Phase 2** scan (expo-camera burst mode, web BarcodeDetector/zxing, USB
  scanner wedge, manual ISBN), lookup wired, add item.
- **Phase 3** library grid/list, filters, sort, book detail, shelves.
- **Phase 4** reading sessions + progress.
- **Phase 5** stats, settings, account deletion (App Store req.), privacy policy.
- **Social (full scope, in roadmap)** Tendances + Discussions (reading circles,
  realtime chat) — the 5-tab shell is already in place.
- **Phase 6 (later)** offline-first via expo-sqlite + PowerSync.
