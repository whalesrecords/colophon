# 01 — Synthèse stratégique

*À lire en premier. Condensé décisionnel des fichiers `02` (benchmark), `03` (coutumes), `04` (normes), `05` (audit), `06` (backlog).*

---

## Le positionnement en une phrase

**Colophon = « le Mangacollec du livre » :** l'application qui prend au sérieux ce qu'on **possède** (collection, séries, éditions, prêts, planning des sorties), là où Goodreads, StoryGraph et Babelio ne trackent que ce qu'on **lit** — le tout en exécution **design-first** absente du marché francophone, avec une **éthique anti-Amazon / RGPD**.

## Pourquoi ce positionnement gagne

1. **Le marché est en mouvement.** Goodreads (Amazon) stagne et perd ses lecteurs à chaque frustration ; StoryGraph a dépassé 5 M d'inscrits (jan. 2026) sur la seule promesse « mieux que Goodreads ». La fenêtre est ouverte.
2. **L'ownership est un white space réel.** Personne ne gère bien la **bibliothèque physique** d'un lecteur généraliste : séries incomplètes, éditions multiples, doublons, prêts, valeur. Mangacollec le fait — mais seulement pour le manga/BD.
3. **La France est le terrain idéal.** 2ᵉ marché mondial du manga (1 BD vendue sur 2 est un manga), forte culture de collection en séries, et un concurrent local (Babelio) vulnérable sur le design et l'ownership.
4. **Colophon est déjà en avance là-dessus.** Le schéma actuel modélise déjà l'exemplaire physique (`items` : état, prix, emplacement, prêts, sessions) — un socle que les leaders n'ont pas (`05`).

## Le diagnostic en une image

| | Ce qu'on **lit** | Ce qu'on **possède** |
|---|---|---|
| Goodreads / StoryGraph / Babelio | ✅✅ | ❌ |
| Mangacollec | ⚠️ (lu/pas lu) | ✅✅ mais **manga/BD only** |
| **Colophon (cible)** | ✅ | ✅✅ **tous livres** |

La stratégie : **garder la couverture « lecture » au niveau du marché**, et **dominer la couverture « possession » pour tous les livres**.

---

## Les 12 décisions structurantes

**Modèle & données**
1. **Séparer deux axes orthogonaux** : *possession* (possédé / wishlist / emprunté) et *statut de lecture* (à lire / en cours / lu / DNF). C'est la décision n°1. *(P0)*
2. **Persister la série** + offrir une **vue de complétion** « tomes possédés / manquants ». Killer feature. *(P0)*
3. **Wishlist de premier ordre** (non possédé), alimentée par les tomes manquants. *(P0)*
4. **Cap data : WEMI** — viser Œuvre / Manifestation / Exemplaire séparés, et **auteurs/sujets en entités d'autorité** (pas en texte), par étapes. *(P2/P3)*

**Expérience**
5. **Anti-friction** : scan + actions en 1 tap, dates pré-remplies. La friction de saisie est la cause n°1 d'abandon.
6. **Anti-pression** : DNF neutre de première classe, notation 100 % optionnelle (demi-étoiles + mood/pace), TBR apaisante, streaks indulgents opt-in.
7. **Modularité** : social, notes, challenges, stats **tous désactivables** — servir les 4 profils de lecteurs sans en effrayer aucun.
8. **Anti-lock-in affiché** : import Goodreads/Babelio **et** export CSV complet = argument de confiance marketing.
9. **Vitesse & calme visuel** non négociables — la leçon de l'exode Goodreads → StoryGraph, et le terrain où le design wabi-sabi de Colophon gagne.

**Croissance & business**
10. **Détection de doublon au scan en librairie** + **planning des sorties** = les deux moteurs de rétention (rouvrir l'app chaque semaine / l'utiliser en magasin).
11. **Monétisation freemium « Plus stats » + Premium collection** (~5 €/mois, ~40-50 €/an) ; **jamais de paywall sur le catalogage de base** ; revenus B2B propres possibles (Masse Critique à la française).
12. **Éthique comme marque** : hébergement EU, RGPD, pas de revente de données, **affiliation libraires indépendants FR** (jamais Amazon).

---

## Les 4 profils de lecteurs à servir (sans les opposer)

| Profil | Besoin | Risque |
|---|---|---|
| **Tracker data** | stats, dashboards | fuit si lent/laid |
| **Social / BookTok** | partage, clubs, buddy reads | fatigue sociale |
| **Collectionneur / propriétaire** | cataloguer, séries, prêts, éditions | abandonne si saisie pénible |
| **Minimaliste** | logger sans noter ni performer | part si on le force |

→ D'où la **modularité** (décision 7) : la même app sert le collectionneur de manga, le statisticien StoryGraph, le membre de club, et le lecteur qui veut juste se souvenir de ce qu'il a lu.

---

## Ce qu'il faut faire en premier (extrait de `06`)

**Sprint 1 = P0** : possession⟂lecture · wishlist · entité série · vue de complétion. C'est le minimum qui transforme Colophon de « énième tracker » en « le Mangacollec du livre ». Tout le reste (import, mood/pace, DNF, formats, planning, recap annuel, content warnings, affiliation) est incrémental et à fort ROI une fois ce socle posé.

> Détail technique, SQL cible et séquencement complet : **`06-recommandations-backlog.md`**.
