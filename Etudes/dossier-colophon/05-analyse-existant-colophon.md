# 05 — Analyse de l'existant Colophon

Audit du schéma `supabase/migrations/` et des features livrées (Phases 1→6 + Social), confronté à l'état de l'art des fichiers `02`/`03`/`04`. Objectif : cartographier **ce qui marche**, **ce qui manque** et **les frictions**.

---

## 1. Ce que Colophon a déjà (et qui est bon)

| Domaine | Existant | Verdict |
|---|---|---|
| **Scan & lookup** | Scan EAN-13 (caméra/zxing/manuel), cascade Google Books → Open Library → BnF, cache `book_metadata` partagé | ✅ Solide. La cascade FR est un vrai atout vs les concurrents anglophones. |
| **Exemplaire** | `items` = copie physique : `location`, `condition`, `purchase_price/date/store`, `notes`, `cover_override` | ✅ **Rare et différenciant.** Déjà un vrai modèle « ownership » que Goodreads/StoryGraph n'ont pas. |
| **Statut de lecture** | `items.status` : `to_read / reading / read / abandoned` | ⚠️ Présent mais **fusionné avec l'exemplaire** (voir §2.1). |
| **Sessions de lecture** | `reading_sessions` datées, page courante, multi-sessions par item | ✅ Bon : permet relectures & progression (coutume clé du §3 coutumes). |
| **Organisation** | `shelves` (M:N), `tags` libres (M:N), facettes/tri/recherche, étagères auto-suggérées | ✅ Couvre le besoin de rangement organique. |
| **Prêts** | `loans` : emprunteur, `lent_on`, `due_on`, `returned_on`, 1 prêt actif/item | ✅ **Killer feature du propriétaire**, déjà là. Manque les rappels. |
| **Séries** | Détection de série, fetch des volumes, sélection & ajout en masse | ⚠️ Le **scan** existe mais **pas l'entité persistée** ni la vue de complétion (voir §2.2). |
| **Social** | Cercles (création/join par code, chat realtime, biblios membres, commentaires, propositions de lecture) | ✅ Bon socle ; correspond à l'appétit « cosy » du §5 coutumes. |
| **Partage** | Lien public `/s/[token]` (biblio/étagère), profil + avatar | ✅ Conforme aux attentes (opt-in). |
| **Stats & tendances** | Dashboard stats, « Lus en {year} », tendances communautaires (#tags), trends | ✅ Base présente ; à enrichir (mood/pace, recap annuel partageable). |
| **Portabilité** | **Export CSV de toute la bibliothèque** | ✅ Excellent positionnement anti-lock-in. **Manque l'import** (Goodreads/Babelio). |
| **Plateformes & tech** | iOS/Android/Web, PWA installable, RLS stricte par user, Realtime | ✅ Fondations saines. |

**Synthèse :** Colophon est **déjà en avance sur l'ownership** par rapport à Goodreads/StoryGraph/Babelio. Le socle exemplaire + prêts + sessions est précisément le white space identifié au `02`. Les manques sont ciblés, pas structurels.

---

## 2. Écarts majeurs (gaps)

### 2.1 ⚠️ Possession et statut de lecture sont fusionnés

**Constat.** Un `item` = une copie physique possédée, ET il porte `status` (to_read/reading/read/abandoned). Conséquences :
- **Impossible de wishlister** un livre non possédé (la wishlist n'existe pas — il faut créer un item, donc « posséder »).
- **Impossible de logger un livre lu mais non possédé** (emprunté en médiathèque/à un ami) sans fausser la collection.
- Le statut `abandoned` = DNF, mais c'est un statut d'exemplaire, pas un événement de lecture neutre.

**Ce que dit la recherche (`03` §3, §6, §8).** Les deux axes sont **orthogonaux** : *possession* (possédé / wishlist / emprunté) vs *statut de lecture* (à lire / en cours / lu / DNF). C'est **la** valeur différenciante d'un app d'ownership. → Correctif structurant dans `06` §1.

### 2.2 ⚠️ Pas d'entité « série » persistée → pas de complétion de collection

**Constat.** La série est détectée au scan et sert à l'ajout en masse, mais rien n'est stocké : pas de `series`, pas de `series_position`, pas de vue « tomes possédés vs manquants », pas de planning des sorties.

**Pourquoi c'est critique (`02` §7, `03` §8, `04` §6).** C'est **la killer feature de Mangacollec** et le besoin n°1 du marché FR (manga = 1 BD vendue sur 2). « Il me manque le tome 7 » + « le tome 12 sort le 3 mars » = moteur de rétention n°1. **Le plus gros gain produit non encore réalisé.** → `06` §2.

### 2.3 Métadonnées plates (pas de WEMI, auteurs en texte)

**Constat.** `book_metadata` aplatit Œuvre + Manifestation ; `authors text[]` ; pas de `series`, `format`, `genre/subjects` structurés, ni `translator`/contributions, ni dimensions.

**Implications (`04`).**
- Pas de regroupement « toutes mes éditions de Dune » (pas de niveau Œuvre).
- Pas de distinction **format** (poche / grand format / ebook / audio) — pourtant un même titre est souvent possédé en plusieurs formats (`03` §1).
- Auteurs non désambiguïsés (homonymes, pseudonymes, mangakas).
- Pas de sujets/genres exploitables pour filtres et recommandations.
→ Montée progressive en entités dans `06` §3-4.

### 2.4 Notation pauvre & pas de signaux qualitatifs

**Constat.** `items.rating numeric(2,1)` (demi-étoiles supportées en base — bien), mais : pas de **mood/pace**, pas de **content warnings**, et la note vit sur l'exemplaire (donc liée à la possession).

**Recherche (`02` §2, `03` §2).** Mood/pace et content warnings sont devenus des **attentes de marché** (premiers motifs de bascule vers StoryGraph). La note doit être **100 % optionnelle** et idéalement portée par la **lecture/œuvre**, pas l'exemplaire. → `06` §5.

### 2.5 DNF culpabilisant & gamification absente

**Constat.** `abandoned` existe mais comme statut neutre d'item ; pas de raison/page d'abandon ; pas d'objectif annuel, pas de recap partageable, pas de défis.

**Recherche (`03` §1, §4).** Le DNF doit être **de première classe et non culpabilisant** (page + raison optionnelles). La gamification doit être **douce, souple, opt-in** (objectif reparamétrable, défis qualitatifs, bilan annuel esthétique = levier d'acquisition virale). → `06` §6.

### 2.6 Pas d'import (lock-in inversé)

**Constat.** Export CSV ✅ mais **aucun import**. La barrière d'entrée pour un utilisateur Goodreads/Babelio/StoryGraph est donc **maximale**.

**Recherche (`03` §7).** L'import propre est désormais un **prérequis d'entrée de gamme**, pas un bonus — c'est ce qui a permis l'exode vers StoryGraph. → `06` §7.

### 2.7 Frictions & angles morts mineurs

- **Prêts sans rappel** : `due_on` stocké mais pas de notification d'échéance.
- **TBR potentiellement anxiogène** : pas de vue « pioche-moi un livre court » ni de séparation TBR possédée / wishlist.
- **Statut « emprunté médiathèque »** absent (date de retour, rappel) — pourtant central pour le public jeune FR (`03` §8).
- **Détection de doublon au scan** : à vérifier/garantir en librairie (mode rapide hors-ligne) — besoin n°1 du propriétaire (`03` §6).
- **Recap annuel partageable** (effet Spotify Wrapped) absent.

---

## 3. Tableau de couverture (état de l'art → Colophon)

| Attendu (benchmark + coutumes) | Statut Colophon | Priorité correctif |
|---|---|---|
| Ownership / exemplaire physique | ✅ Présent (avance) | — |
| Prêts | ✅ Présent | P2 (rappels) |
| Sessions / relectures | ✅ Présent | — |
| Étagères + tags | ✅ Présent | — |
| Export ouvert | ✅ CSV | — |
| Social / cercles cosy | ✅ Présent | — |
| **Possession ⟂ statut de lecture** | ❌ Fusionnés | **P0** |
| **Wishlist (non possédé)** | ❌ Absent | **P0** |
| **Série persistée + complétion** | ❌ Absent | **P0** |
| **Statut emprunté (médiathèque)** | ❌ Absent | P1 |
| **Import Goodreads/Babelio** | ❌ Absent | P1 |
| **DNF neutre + raison/page** | ⚠️ Partiel | P1 |
| **Mood / pace** | ❌ Absent | P1 |
| **Content warnings** | ❌ Absent | P2 |
| **Format (poche/audio/ebook)** | ❌ Absent | P1 |
| **Planning des sorties** | ❌ Absent | P1 |
| **Objectif annuel + recap partageable** | ❌ Absent | P1 |
| Détection de doublon au scan | ⚠️ À garantir | P1 |
| Niveau Œuvre (regrouper éditions) | ❌ Absent | P2 |
| Auteurs/sujets en autorités | ❌ Texte | P3 |
| Cote / classement structuré | ⚠️ `location` libre | P3 |
| Affiliation libraire indé FR | ❌ Absent | P2 (business) |

---

## 4. Conclusion de l'audit

Colophon n'a pas un problème de fondations — elles sont **saines et déjà différenciantes sur l'ownership**. Il a un problème de **complétude ciblée** : trois manques **structurants** (possession⟂lecture, wishlist, série persistée) bloquent l'expression de son avantage « Mangacollec du livre ». Une fois ces trois levés, les manques suivants (import, mood/pace, DNF, formats, planning, recap) sont des ajouts incrémentaux à fort ROI.

→ Plan d'action détaillé et phasé : **`06-recommandations-backlog.md`**.
