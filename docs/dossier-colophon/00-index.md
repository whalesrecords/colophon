# Dossier de référence — Colophon

> Dossier bibliothéconomique & produit destiné à **enrichir l'application Colophon**.
> Conçu pour être lu par un humain **et** exploité par Claude Code comme base de connaissances.
> Rédigé le 2026-06-26. Sources datées 2022–2026.

## À quoi sert ce dossier

Colophon est un gestionnaire de **bibliothèque personnelle + tracker de lecture** (« le Mangacollec du livre ») :
scan ISBN → catalogage de ce qu'on possède → suivi de lecture → étagères, tags, prêts, cercles, stats, partage, tendances.
Mono-codebase Expo → iOS + Android + Web, backend Supabase.

Ce dossier répond à trois questions :
1. **Ce qui existe déjà** sur le marché (benchmark concurrentiel).
2. **Ce que font réellement** les lecteurs, les collectionneurs et les bibliothécaires (coutumes + métier).
3. **Ce qu'il faut faire** pour que Colophon « fonctionne correctement » (analyse de l'existant + backlog priorisé + modèle de données).

## Sommaire

| # | Fichier | Contenu |
|---|---------|---------|
| 00 | [`00-index.md`](./00-index.md) | Ce sommaire + mode d'emploi |
| 01 | [`01-synthese-strategique.md`](./01-synthese-strategique.md) | **À lire en premier.** Positionnement, white space, 12 décisions structurantes |
| 02 | [`02-benchmark-concurrents.md`](./02-benchmark-concurrents.md) | Goodreads, StoryGraph, Hardcover, LibraryThing, Babelio, Mangacollec, Bookwyrm, Oku, Fable, Bookly… + matrice + monétisation |
| 03 | [`03-coutumes-lecteurs.md`](./03-coutumes-lecteurs.md) | UX des habitudes réelles : tracking, notation, TBR, DNF, gamification, social, ownership, marché FR |
| 04 | [`04-metier-bibliothecaire-normes.md`](./04-metier-bibliothecaire-normes.md) | ISBN/EAN, FRBR/WEMI, Dewey, RAMEAU/autorités, ISBD/RDA, séries, qualité métadonnées |
| 05 | [`05-analyse-existant-colophon.md`](./05-analyse-existant-colophon.md) | Audit du schéma & des features actuelles ; écarts vs l'état de l'art |
| 06 | [`06-recommandations-backlog.md`](./06-recommandations-backlog.md) | Backlog priorisé (P0→P3) + proposition de modèle de données cible |
| 07 | [`07-glossaire.md`](./07-glossaire.md) | Vocabulaire bibliothéconomique FR réutilisable dans l'UI / la doc |

## Mode d'emploi pour Claude Code

- Avant d'implémenter une feature « bibliothèque/lecture/collection », **consulter `01` (décisions) et `06` (backlog + data model)**.
- Pour toute question de **métadonnées, séries, autorités, identifiants** → `04`.
- Pour les **choix UX** (anti-friction, anti-pression, modularité) → `03`.
- Le fichier `05` cartographie l'écart entre le schéma `supabase/migrations/` actuel et la cible.
- Les recommandations de modèle de données dans `06` sont **des cibles**, pas un ordre de migration : phaser selon le backlog.

## Les 5 idées à retenir si vous ne lisez rien d'autre

1. **L'ownership est la brèche.** Goodreads, StoryGraph et Babelio trackent ce qu'on *lit* ; personne ne gère bien ce qu'on *possède* (séries incomplètes, éditions, doublons, prêts). C'est le cœur différenciant de Colophon.
2. **Séparer deux axes orthogonaux** : *possession/exemplaire* vs *statut de lecture*. Un livre peut être possédé-non-lu, lu-non-possédé (médiathèque), wishlisté, en double.
3. **Le suivi de séries (tomes possédés/manquants)** est la killer feature — surdimensionnée en France, 2ᵉ marché mondial du manga.
4. **Anti-friction + anti-pression + anti-lock-in** : scan rapide, DNF neutre, notation optionnelle, import/export ouverts. Ce sont les vraies causes de rétention/abandon.
5. **Modèle de données = WEMI** (Œuvre / Manifestation / Exemplaire séparés) + **auteurs et sujets en entités d'autorité**, pas en chaînes de texte.
