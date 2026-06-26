# 06 — Recommandations & backlog priorisé

Plan d'action pour que Colophon « fonctionne correctement » et exprime son avantage **« le Mangacollec du livre »**. Priorités : **P0** (structurant, débloque l'avantage) → **P1** (forte valeur) → **P2** (différenciant) → **P3** (excellence biblio).

> Les modèles de données ci-dessous sont des **cibles**. Phaser via migrations additives (Supabase MCP), sans casser l'existant. Conserver la RLS « owner-only » et le pattern `EXISTS` sur la table parente.

---

## P0 — Les trois déblocages structurants

### P0.1 — Séparer possession et statut de lecture

**Problème (`05` §2.1).** `items` fusionne « copie possédée » et `status` de lecture, ce qui interdit wishlist et livres lus-non-possédés.

**Cible.** Deux axes orthogonaux :
- **Axe possession** (sur l'exemplaire) : `owned` / `wishlist` / `borrowed` (+ sous-cas médiathèque/ami).
- **Axe lecture** (événement/œuvre) : `to_read` / `reading` / `read` / `dnf`.

```sql
-- Axe possession porté par l'exemplaire
alter table items add column ownership text not null default 'owned'
  check (ownership in ('owned','wishlist','borrowed'));
alter table items add column borrowed_from text;     -- médiathèque / nom d'ami
alter table items add column due_back date;           -- date de retour (emprunt)
alter table items add column format text               -- voir P1.4
  check (format in ('paperback','hardcover','pocket','ebook','audio','other'));
-- items.status reste l'axe lecture, on y ajoute 'dnf' (cf P1.3) et on déprécie 'abandoned'
```

**UX.** Le scan demande en 1 tap : « Je le possède / Je le veux (wishlist) / Emprunté ». Le statut de lecture est indépendant. Une wishlist = `ownership='wishlist'` (pas de prix/emplacement requis).

**Impact.** Débloque wishlist, emprunt médiathèque, et la justesse de toutes les stats. **Fondation de tout le reste.**

---

### P0.2 — Persister la série + vue de complétion

**Problème (`05` §2.2).** Séries détectées au scan mais non stockées → pas de « tomes possédés/manquants ».

**Cible.**
```sql
create table series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text,                         -- 'manga' | 'bd' | 'roman' | 'comics'
  total_volumes int,                 -- si connu (nullable : séries en cours)
  source text, external_id text,     -- provenance métadonnées
  created_at timestamptz default now()
);
-- rattachement au niveau métadonnée (manifestation)
alter table book_metadata add column series_id uuid references series(id);
alter table book_metadata add column series_position numeric;  -- triable (gère 7.5)
create index book_metadata_series_idx on book_metadata(series_id, series_position);
```

**Feature : vue « Collection / Série ».** Pour chaque série présente dans ma biblio :
- grille des tomes 1..N avec état **possédé / manquant / wishllist / lu** ;
- compteur « 14/22 tomes » + tomes manquants en un coup d'œil ;
- bouton « ajouter les manquants à la wishlist ».

**Impact.** **Le plus gros gain produit.** Killer feature FR (manga/BD) et inédite pour les romans en saga.

---

### P0.3 — Wishlist de premier ordre

Conséquence directe de P0.1 : un onglet/vue **Envies** (wishlist), alimenté par :
- ajout manuel / scan « je le veux » ;
- tomes manquants d'une série (P0.2) ;
- propositions de lecture des cercles.

Optionnel : **liste d'achat / panier** exportable, avec lien d'achat **libraire indé** (cf. P2 business). Modèle Mangacollec « Envies » éprouvé (`02` §7).

---

## P1 — Forte valeur, incrémental

### P1.1 — Import Goodreads & Babelio

**Pourquoi (`05` §2.6).** Prérequis d'entrée de gamme : sans import, la migration depuis Goodreads/Babelio est bloquée.
- Parser le CSV Goodreads (Title, Author, ISBN, My Rating, Dates Read, Shelves, Bookshelves…).
- Re-résoudre l'ISBN manquant via la cascade lookup existante (l'export Goodreads perd 22-38 % des ISBN).
- Mapper shelves → `shelves`/`tags`, ratings → `rating`, dates → `reading_sessions`.
- Idéalement aussi : export CSV **enrichi** (ajouter colonnes séries/format/ownership).

### P1.2 — Statut « emprunté » (médiathèque / ami) + rappels

Déjà préparé par P0.1 (`ownership='borrowed'`, `borrowed_from`, `due_back`). Ajouter :
- notification locale d'échéance de retour ;
- vue « À rendre bientôt ».
Parle directement au public jeune FR (médiathèques, `03` §8). Réutiliser le même mécanisme de rappel pour `loans.due_on` (`05` §2.7).

### P1.3 — DNF de première classe

```sql
-- remplacer 'abandoned' par 'dnf' dans le check de items.status (migration douce)
alter table reading_sessions add column dnf_page int;     -- où j'ai arrêté
alter table reading_sessions add column dnf_reason text;  -- optionnel, libre ou enum
```
UX neutre, jamais « échec ». Réglage : **inclure ou non les DNF** dans le compteur d'objectif annuel (`03` §1).

### P1.4 — Format au niveau exemplaire

`items.format` (P0.1) : poche / grand format / broché / relié / ebook / audio. Permet : posséder un titre en plusieurs formats, stats par format, filtres. (`03` §1, `04` §1.1)

### P1.5 — Mood / pace (signaux qualitatifs)

```sql
create table reading_impressions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  moods text[],        -- reflective, tense, hopeful, emotional, funny, dark, cozy…
  pace text check (pace in ('slow','medium','fast')),
  character_or_plot text check (character_or_plot in ('character','plot','balanced')),
  created_at timestamptz default now()
);
-- RLS via EXISTS sur items (pattern existant)
```
Exploitable pour **filtres** (« un livre *tense* et *fast* ce soir ») et **reco**. Différenciant StoryGraph (`02` §2, `03` §2). Tout optionnel.

### P1.6 — Objectif annuel souple + recap partageable

- Objectif reparamétrable : **livres OU pages OU heures**, modifiable sans friction, **désactivable**.
- **Bilan annuel esthétique et partageable** (effet Spotify Wrapped) : levier d'acquisition virale à faible coût émotionnel (`03` §4). Réutiliser la direction design wabi-sabi pour un artefact « shelfie/recap » exportable en image.

### P1.7 — Planning des sorties (séries suivies)

Sur la base de P0.2 : pour les séries que je possède/suis, afficher les **prochaines parutions** (date du prochain tome) et alerter. Moteur de rétention n°1 de Mangacollec (`02` §7). Nécessite une source de dates de sortie (BnF/éditeurs/Open Library « expected publish date » ; à défaut, saisie communautaire).

### P1.8 — Détection de doublon au scan (mode librairie)

Garantir qu'au scan, l'app signale immédiatement « **tu possèdes déjà ce livre** » / « il est dans ta wishlist » / « tu l'as DNF ». Besoin n°1 du propriétaire en magasin (`03` §6). Doit rester rapide, idéalement utilisable hors-ligne (cache local de la collection).

---

## P2 — Différenciant

- **P2.1 Content warnings** : champ structuré (graphic/moderate/minor), présenté comme **service au lecteur** (filtre/alerte opt-in), jamais jugement (`03` §2).
- **P2.2 Affiliation libraire indé FR** : liens d'achat vers **Place des Libraires / Lalibrairie.com / Decitre / libraire local**, jamais Amazon. Cohérent avec le positionnement éthique ; voie de revenus propre (`02` §13).
- **P2.3 Niveau Œuvre (Work)** : regrouper toutes les éditions/exemplaires d'une même œuvre (`04` §2). Permet « mes 3 éditions de Dune », fusion des doublons d'édition, et de meilleures stats œuvre vs exemplaire.
- **P2.4 Sondages / tops communautaires** : enrichir « Tendances » avec des formats ludiques façon Sens Critique (« meilleurs polars 2025 ») (`02` §6).
- **P2.5 Vue « shelfie » esthétique** : générer de belles vues d'étagères partageables (lien Bookstagram, `03` §6).
- **P2.6 Buddy reads anti-spoiler** dans les cercles : commentaires **ancrés à une page**, masqués jusqu'à atteinte du passage (modèle StoryGraph, `03` §5).

---

## P3 — Excellence bibliothéconomique (long terme)

- **P3.1 Auteurs en entités d'autorité** : table `authors` (`forme_retenue`, `viaf`, `isni`, `idref`, `variantes[]`) au lieu de `authors text[]` ; désambiguïsation homonymes/pseudonymes/mangakas (`04` §4).
- **P3.2 Sujets vs genre/forme** : `subjects[]` (topical, RAMEAU) + `genre_form[]`, depuis data.bnf.fr ; alimente filtres et reco (`04` §4.1).
- **P3.3 Contributions à rôle typé** : `contributions[]` (auteur / traducteur / illustrateur / préface) au lieu d'un simple `authors` (`04` §5.2).
- **P3.4 Cote / classement** : structurer `items.location` ; champ `cote` auto-suggéré (Dewey simplifiée + 3 lettres d'auteur + tomaison) ; génération d'étiquettes (`04` §3).
- **P3.5 Expressions / traductions** : niveau Expression pour distinguer proprement VO/VF et versions (`04` §2.3).

---

## Modèle de données cible (vue d'ensemble)

```
WORK (P2.3)                 ← regroupe les éditions d'une même œuvre
  └─ MANIFESTATION = book_metadata (+ series_id, series_position, format-as-meta)
        └─ ITEM = items (exemplaire possédé : ownership, format, état, prix, cote, prêt)
              ├─ reading_sessions (lectures datées, DNF page/raison)
              ├─ reading_impressions (mood/pace)  [P1.5]
              ├─ loans (prêts)
              ├─ item_shelves / item_tags
              └─ (cover_override)
SERIES (P0.2) ──< book_metadata
AUTHORS (P3.1) ──< work/manifestation (autorités VIAF/ISNI/IdRef)
SUBJECTS + GENRE_FORM (P3.2)
```

**Règle d'or de migration.** Tout additif, jamais destructif tant qu'une feature dépend de l'ancien champ. La séparation **Work / Manifestation / Item** est la décision la plus structurante — mais `items` faisant déjà office d'Item, la priorité immédiate est **P0** (possession⟂lecture, série, wishlist), pas la refonte WEMI complète.

---

## Séquencement recommandé

1. **Sprint 1 (P0)** : possession⟂lecture + wishlist + entité série + vue complétion. → débloque l'avantage « Mangacollec du livre ».
2. **Sprint 2 (P1 cœur)** : import Goodreads/Babelio, statut emprunté + rappels, DNF, format.
3. **Sprint 3 (P1 engagement)** : mood/pace, objectif annuel + recap partageable, planning des sorties, doublon au scan.
4. **Sprint 4+ (P2)** : content warnings, affiliation libraire, Work, tops communautaires, shelfie, buddy reads.
5. **Continu (P3)** : montée en qualité bibliothéconomique (autorités, sujets, cote).

> **Garde-fous UX transverses (issus de `03`)** : modularité (tout désactivable : social/notes/challenges/stats) · anti-friction (scan + actions en 1 tap, dates pré-remplies) · anti-pression (DNF neutre, notation optionnelle, streaks indulgents opt-in, TBR apaisante) · anti-lock-in affiché (import + export = argument de confiance) · vitesse & calme visuel non négociables.
