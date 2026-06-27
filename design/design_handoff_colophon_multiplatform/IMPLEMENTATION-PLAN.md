# Plan d'implémentation — Colophon multiplateforme & P0

Cible : la codebase **`biblio/`** (Expo SDK / Expo Router · React Native + RN Web · Tamagui · Supabase · TypeScript · pnpm). Ce plan mappe chaque écran du handoff à des **migrations**, **features**, **routes** et **composants** concrets, et précise la stratégie **responsive / multiplateforme**. Règle d'or : **tout additif, jamais destructif** ; conserver la RLS « owner‑only » (pattern `EXISTS` sur la table parente).

> Réfs internes : `docs/dossier-colophon/05-analyse-existant-colophon.md` (audit) et `06-recommandations-backlog.md` (backlog priorisé). Ce plan exécute le **Sprint 1 (P0)** et pose les bases multiplateforme.

---

## 0. Stratégie multiplateforme (une base, quatre cibles)

La codebase est **Expo + React Native Web** → **une seule base de composants** pour iOS, Android, iPad, Web et macOS. Différencier par **breakpoint**, pas par fork.

| Cible | Build | Layout |
|---|---|---|
| iOS / Android | Expo natif | pile + barre d'onglets (existant) |
| **iPad** | Expo natif (déjà supporté, `app.json → ios.supportsTablet`) | **split‑view** : sidebar permanente dès largeur *regular* |
| **Web App** | `expo export --platform web` (déjà sur Vercel, cf. `vercel.json`) | sidebar + contenu (+ inspecteur) |
| **macOS** | **Mac Catalyst** via Expo (`app.json → ios.supportsTablet` + cible Catalyst), ou wrapper desktop du build web | **multi‑colonnes** type Books/Mail, chrome natif |

**Hook de breakpoint** (nouveau) `src/lib/use-layout.ts` :
```ts
// compact  < 700  → onglets mobiles
// regular  700–1100 → split-view (iPad)
// expanded ≥ 1100 → multi-colonnes (Web/macOS, sidebar + contenu + inspecteur optionnel)
export type LayoutClass = 'compact' | 'regular' | 'expanded';
```
Utiliser Tamagui media queries (`$gtSm`, `$gtMd`) là où c'est purement présentationnel.

**Navigation adaptative** — `src/app/(app)/_layout.tsx` :
- `compact` → `Tabs` (existant) avec **nouvel onglet Envies** (cf. §3).
- `regular` / `expanded` → remplacer les Tabs par un **`<AppSidebar/>`** (nouveau, `src/components/nav/AppSidebar.tsx`) en `Drawer`/layout permanent ; routes inchangées (Expo Router gère les deux présentations).

**Chrome macOS** : sur Catalyst, masquer la barre d'onglets, activer la **toolbar** native (titre de vue + recherche + bascule grille/liste) ; la sidebar paper devient la *primary column*. Reproduire la barre de titre unifiée (feux à gauche au‑dessus de la sidebar) telle que mockée.

---

## 1. P0.1 — Possession ⟂ statut de lecture

### Migration `supabase/migrations/<ts>_ownership_axis.sql`
```sql
alter table items add column ownership text not null default 'owned'
  check (ownership in ('owned','wishlist','borrowed'));
alter table items add column borrowed_from text;   -- médiathèque / nom d'ami
alter table items add column due_back date;
alter table items add column format text
  check (format in ('paperback','hardcover','pocket','ebook','audio','other'));
-- items.status reste l'axe lecture ; ajouter 'dnf', déprécier 'abandoned' (P1.3)
create index items_ownership_idx on items(user_id, ownership);
```
RLS : inchangée (colonnes sur table déjà protégée). Régénérer `src/lib/database.types.ts`.

### Code
- `src/lib/book.ts` / types : ajouter `ownership`, `borrowed_from`, `due_back`, `format`.
- **`src/features/library/use-add-item.ts`** : accepter `ownership` (défaut `'owned'`) ; un ajout `wishlist` n'exige **ni prix ni emplacement**.
- **`src/features/library/use-library.ts` / `faceting.ts`** : ajouter la facette `ownership` ; **exclure par défaut** `wishlist` de la vue « Toutes » (les envies ont leur propre vue).
- **`src/features/library/duplicates.ts`** : déjà présent — l'exposer au **scan** pour la détection doublon (cache local de la collection pour usage hors‑ligne, cf. P1.8).

### Écran G — Scan possession (`design ref : iOS Scan possession`)
- `src/components/scan/SearchPanel.tsx` / `use-scan-session.ts` : après résolution métadonnées, afficher la **feuille de possession** (3 choix `owned/wishlist/borrowed`) + bannière **doublon** (terracotta) si `duplicates` matche ; le **statut de lecture** est un sélecteur séparé pré‑rempli `to_read`.

---

## 2. P0.2 — Série persistée + complétion

### Migration `supabase/migrations/<ts>_series.sql`
```sql
create table series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text,                       -- 'manga'|'bd'|'roman'|'comics'
  total_volumes int,               -- nullable (séries en cours)
  source text, external_id text,
  created_at timestamptz default now()
);
alter table book_metadata add column series_id uuid references series(id);
alter table book_metadata add column series_position numeric;  -- gère 7.5
create index book_metadata_series_idx on book_metadata(series_id, series_position);
```
La détection de série existe déjà au scan (`src/features/books/use-series-volumes.ts`, `src/lib/series.ts`) mais **n'est pas persistée** → désormais : à l'ajout, upsert `series` + renseigner `series_id`/`series_position` sur `book_metadata`.

### Feature (nouveau) `src/features/series/`
- `use-series.ts` — liste des séries présentes dans ma biblio (group by `series_id`).
- `use-series-detail.ts` — pour une série : tomes `1..N`, état par tome dérivé en **joignant** `book_metadata.series_position` × `items` (de l'utilisateur) :
  - `read` si un item lu, `owned` si possédé non lu, `wishlist` si `ownership='wishlist'`, sinon `missing`.
  - sortie : `volumes[]`, `ownedCount`, `readCount`, `missingPositions[]`, `pct`.
- Réutiliser/compléter `src/features/library/group-series.ts` (déjà là) pour le regroupement.

### Écrans B & F — Série & complétion
- **Route** `src/app/(app)/series/[id].tsx` (push mobile ; colonne contenu en expanded).
- **Composant** `src/components/series/SeriesCompletion.tsx` : carte de complétion (compteur `ownedCount/total` Spectral, rail aizome, légende 4 états) + **grille de tomes**.
- **Composant** `src/components/series/VolumeCell.tsx` : si présent → `BookCover` (`src/components/BookCover.tsx`) en **mode saga** (bg/fg uniformes, `tag="TOME {romain}"`) + badge d'état ; si manquant → **fantôme** (View pointillée + numéro romain). Helper `toRoman(n)`.
- Action **« Ajouter les N manquants aux envies »** → crée N items `ownership='wishlist'` avec `series_id`/`series_position` (mutation dans `use-series-detail.ts`).
- Sidebar (macOS/Web) : section **COLLECTIONS → Séries** listant les séries (sous‑items).

---

## 3. P0.3 — Envies (wishlist)

Vue dérivée, pas de table dédiée : `items WHERE ownership='wishlist'` + tomes manquants des séries.

### Feature (nouveau) `src/features/wishlist/use-wishlist.ts`
- Retourne les items `wishlist`, groupés (livres seuls / par série), + agrégat « tomes manquants de mes séries » (via `use-series`).
- Mutation `promote(itemId)` : `wishlist → owned` (ouvre la fiche exemplaire pour prix/emplacement optionnels).
- `buildPurchaseList()` : liste d'achat exportable (réutiliser `src/features/library/export-csv.ts`) avec liens **libraire indé FR** (Place des Libraires / Lalibrairie.com / Decitre), **jamais Amazon** (P2.2).

### Écrans D & E — Envies
- **Onglet mobile** : ajouter `src/app/(app)/(tabs)/envies.tsx` + l'entrée dans `(tabs)/_layout.tsx` (icône cœur, actif **ochre `#B0853A`**). Ordre : Bibliothèque · **Envies** · Scan (central) · Échanges · Profil.
- **Web/macOS** : item sidebar **Envies** (point ochre) ; route partagée `/(app)/envies`.
- **Composant** `src/components/wishlist/WishlistGrid.tsx` : couvertures + pastille `ENVIE` ochre + action « + Ajouter » ; carte **Liste d'achat** ; section **« Tomes manquants de vos séries »** (fantômes, ajout 1 clic).

---

## 4. Layouts multiplateforme (présentation)

### `AppSidebar` (nouveau) `src/components/nav/AppSidebar.tsx`
Paper sidebar partagée iPad/Web/macOS : wordmark `◆ Colophon`, sections **BIBLIOTHÈQUE** (Toutes/En cours/À lire/Lu/**Envies**) + **COLLECTIONS** (**Séries**/étagères via `use-shelves.ts`), pied Statistiques/Scanner. Item actif : fond `rgba(43,58,85,0.10)`, texte aizome 600, rayon 6. Largeur 240 (macOS) / 228 (iPad) / 250 (Web). Sur iPad : fond translucide `rgba(247,244,236,0.86)` + blur.

### Bibliothèque responsive `src/app/(app)/(tabs)/index.tsx`
- Extraire le contenu en `LibraryView` réutilisable (grille de couvertures). Colonnes par breakpoint : **3** (compact) · **5** (regular/iPad) · **6** (expanded/Web‑macOS). Gaps : 16×14 (mobile) · 26×22 (iPad) · 28×24 (desktop). Réutiliser `src/components/BookCover.tsx` + carte (`BookSpines.tsx` pour la vue liste).
- En‑tête : surtitre + titre Spectral (33 mobile / 32–34 desktop), recherche (`SearchPanel`), filtres (`library/FilterPanel.tsx`), tri.

### macOS chrome
- Barre de titre unifiée `#EEE8DC` (h 46) : feux natifs (Catalyst les fournit ; en wrapper web, reproduire 12px `#ff5f57/#febc2e/#28c840`), chevrons préc./suiv., titre de vue Spectral, recherche, bascule grille/liste (carré actif aizome). Sidebar `#F4F0E7`.

---

## 5. Reste du backlog (rappel de séquencement)
Après P0 (ce plan), enchaîner **Sprint 2 (P1 cœur)** : import Goodreads/Babelio (`06 §P1.1`), statut **emprunté** + rappels (déjà préparé par les colonnes `borrowed_from`/`due_back`), **DNF** de 1ʳᵉ classe, **format**. Puis **Sprint 3** : mood/pace, objectif annuel + **recap partageable** (artefact « shelfie » wabi‑sabi), planning des sorties, doublon au scan. Détail complet : `docs/dossier-colophon/06-recommandations-backlog.md`.

## 6. Checklist d'implémentation P0
- [ ] Migration `ownership_axis.sql` + régénérer `database.types.ts`
- [ ] Migration `series.sql` + persistance série au scan
- [ ] `use-add-item` : param `ownership`; wishlist sans prix/emplacement
- [ ] `faceting`/`use-library` : facette `ownership`, exclure wishlist de « Toutes »
- [ ] `features/series/*` + route `series/[id]` + `SeriesCompletion` + `VolumeCell`
- [ ] `features/wishlist/*` + onglet **Envies** + `WishlistGrid` + liste d'achat
- [ ] Scan : feuille possession 1 tap + bannière doublon (`duplicates.ts`)
- [ ] `use-layout` + `AppSidebar` + `LibraryView` responsive (3/5/6 colonnes)
- [ ] Navigation adaptative (Tabs compact ↔ Sidebar regular/expanded)
- [ ] Build macOS (Catalyst) : chrome/toolbar, masquer onglets
- [ ] QA tokens (aizome vs ochre, états de tome), cibles ≥ 44 px, tout opt‑in
