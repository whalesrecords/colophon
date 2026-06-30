# Handoff — Colophon · Gamification (Objectif du jour + Coin lecture)

## Overview
Deux livrables liés autour de l'engagement / lecture régulière de **Colophon** :

- **A · Objectif du jour (refonte)** — refonte de la carte d'objectif quotidien : un héro de progression clair, puis trois rythmes (semaine · mois · année), puis le réglage de la cible. **Ça redessine un composant qui existe déjà** dans le code (`DailyGoalCard.tsx`).
- **B · Mon coin lecture (nouveau jeu)** — une couche ludique façon *Foodvisor de la lecture* : lire **nourrit** une étagère (les livres s'ajoutent), **rapporte des lumens** (monnaie), qu'on **mise** sur des défis ou **dépense** en boutique (lampes, plantes, coussins, nouvelles étagères) pour rendre le coin lecture douillet. La mascotte **Colette** (illustration au trait déjà présente dans le projet) y vit. **C'est une fonctionnalité neuve** — rien d'équivalent dans le code aujourd'hui.

L'app est **Expo / React Native + Tamagui**, FR par défaut, Supabase en back, TanStack Query côté données. Polices **Spectral** (serif éditorial) + **Schibsted Grotesk** (UI). Palette « Les tranches » (brique / prussien / forêt / ocre) sur fond parchemin, esprit wabi-sabi.

## About the Design Files
Les fichiers `.dc.html` de ce bundle sont des **références de design** (prototypes HTML montrant le rendu et le comportement voulus) — **pas du code à copier tel quel**. La tâche est de **recréer ces écrans dans le codebase existant** (Expo/RN/Tamagui) avec ses patterns et libs en place (`Card`, `SectionLabel`, `PackIcon`, `react-native-svg`, `@/theme/tokens`, TanStack Query, Supabase). Pour ouvrir les `.dc.html` dans un navigateur, garder `support.js` à côté.

## Fidelity
**Haute-fidélité** pour A (Objectif du jour) : couleurs, tailles, espacements définitifs, et le composant cible existe déjà — c'est un **restyle/restructure**, pas une création.
**Concept haute-fidélité** pour B (Coin lecture) : le rendu visuel est définitif, mais la fonctionnalité est **neuve** — modèle de données, économie et boutique sont à concevoir (proposition de schéma plus bas).

---

# A · Objectif du jour (refonte)

> **Fichier de référence :** `Colophon - Objectif du jour.dc.html` (version large + version mobile)
> **Composant cible (existe déjà) :** `biblio/src/components/reading/DailyGoalCard.tsx`
> **Données (inchangées) :** `biblio/src/features/reading/use-daily-goal.ts`

### Ce qui ne change pas
Le modèle de données est **identique** — ne pas y toucher. `useDailyGoal(userId)` renvoie déjà `{ goal, today, streak, goalSet, byDay, minutesToday }`. Les presets de cible sont déjà `[10, 20, 30, 50]`. Le widget iOS est déjà synchronisé via `syncReadingWidget`. La règle anti-honte (jour en cours qui ne casse pas la série + un jour de grâce) reste.

### Ce qui change (restructuration de `DailyGoalCard.tsx`)
La carte actuelle empile les blocs ; la refonte impose une **structure en quatre temps séparés par des filets**, et corrige la lisibilité.

1. **En-tête** — `SectionLabel` « Objectif du jour » à gauche ; à droite la **pastille de série** (déjà là : `PackIcon name="flame"` + `{streak} jour(s)`), fond `#F1E7D3`, bord `#E6D7B8`, radius 999, texte `#2A1E15`. *(le mock dessine une flamme custom `#BE5C28` — garder l'icône `flame` du pack, pas d'emoji).* 
2. **Héro de progression** — anneau **plus grand (132 px, mobile 104 px)**, trait 11 px, piste `#E4DAC7`, remplissage `palette.forest` si atteint sinon `palette.brick`, `%` au centre en Spectral 30. **À côté** : eyebrow date (`Aujourd'hui · mar. 30 juin`), puis le compteur en gros **Spectral 600, 58 px (mobile 44)** : `64` suivi de `/ 50 pages` en `#8C8479` 22 px. Sous le compteur, ligne d'état avec une **coche** (`check`, `palette.forest`) + « Objectif atteint, bravo. » en forêt 15 px — sinon « Encore N pages aujourd'hui ».
3. **Filet** `height:1; background:#EAE2D1; margin:28px 0`.
4. **Cette semaine + mois (côte à côte)** — à gauche `WeekStrip` (déjà codé) : 7 pastilles **30 px** (mock) avec initiale L M M J V S D au-dessus ; jour atteint = forêt plein, aujourd'hui cerclé (`outline 2.5px #2A1E15 offset 2px`), à venir = contour `#DDD0B5`. Légende sous la bande en **encre** : « Lundi et aujourd'hui validés. 2 jours cette semaine. » À droite, le **mois courant** en grille 7 colonnes (`MonthGrid`, déjà codé) : pastilles 22 px, jour 1 calé sur son jour de semaine, aujourd'hui cerclé, jours futurs en **pointillés** `#D8CAAE`.
5. **Filet.**
6. **Cette année** — `YearRings` (déjà codé) : 12 petits anneaux (40 px large / 26 px mobile), remplissage = part des jours du mois ayant atteint l'objectif, mois courant en gras/accent, initiales J F M A M J J A S O N D.
7. **Filet.**
8. **Cible quotidienne** — libellé « Cible quotidienne » puis 4 chips `[10] [20] [30] [50] pages` ; chip actif = fond espresso `#2A1E15`, texte parchemin ; inactifs = fond `#EFE6D3`, bord `#E2D4B8`, nombre Spectral 600. `onPress` → `useSetDailyGoal().mutate(p)` (déjà câblé).

### Correctifs de lisibilité demandés (importants)
- **Sous-titres de section en encre** : `MiniLabel`/`SectionLabel` passent de `$colorMuted` (gris pâle, peu lisible sur parchemin) à **`palette.espresso` `#2A1E15`** pour « Cette semaine », le mois, « Cette année », « Cible quotidienne ».
- **Données cohérentes** : afficher un compteur réaliste (`today` vs `goal`, p. ex. 64/50). L'ancienne maquette montrait « 1430 / 50 » (donnée de test) — à bannir. Les jours validés de la bande semaine doivent concorder avec la série affichée.
- **Mois en grille** calée 7 colonnes (déjà géré par `MonthGrid`), aujourd'hui cerclé, demain en pointillés.

### Layout (mesures de la maquette)
Carte large **940 px**, fond `#FBF6EC` (= `palette.paperCard` via `<Card>`), bord 1px `#EAE2D1`, radius 28, padding 40, ombre `0 18px 50px rgba(42,30,21,0.12)`. Version mobile **390 px**, radius 26, padding 26, anneau 104 px, compteur 44 px, filets `margin:22px 0`. Tout en flex + `gap`.

---

# B · Mon coin lecture (nouveau jeu)

> **Fichier de référence :** `Colophon - Coin lecture (jeu).dc.html` (4 écrans : Coin lecture · Boutique · Défis · Évolution)
> **Statut :** fonctionnalité **neuve** — à créer. Réutilise les défis de cercle existants (`@/features/social/use-challenges.ts`) comme base pour des défis solo récompensés, mais l'économie (lumens) et la boutique sont à bâtir.

### La boucle de jeu
1. **Lire nourrit la biblio.** Chaque livre terminé s'ajoute physiquement à l'étagère (à sa tranche de couleur). On voit sa bibliothèque grandir.
2. **Lire rapporte des lumens** (✦, la monnaie). Pages, séries et défis créditent des lumens.
3. **On dépense / on mise.** En boutique (lampes, plantes, tapis, coussin de Colette, nouvelle étagère = +12 emplacements), ou en misant sur un défi pour doubler.
4. **Le coin monte de niveau.** De « Pile à lire » (nu) à « Cabinet de lecture » (plein, chaud). Colette y veille (ronronne quand la série tient).

### Écran 1 — Coin lecture (hero)
- **Fond** dégradé parchemin chaud `linear-gradient(180deg,#F3EAD6,#ECDDC3 58%,#E4D2B4)`, halo de lampe ambré `radial rgba(224,178,98,.55)`.
- **En-tête** : eyebrow « Niveau 4 » (`#A98C5A`), titre Spectral 27 « Bibliothèque » ; à droite **solde de lumens** : pastille crème, `✦` doré `#D8A23E` + `1 240` en Spectral 600.
- **La scène** : une **étagère** (caisson bois `#E7D7B9`, bord 4px `#2A1E15`, séparateurs `#2A1E15`) à 2 rayons. Rayon 1 bien rempli de **tranches colorées** (brique/prussien/encre/ocre/forêt + pile couchée), rayon 2 partiel avec un **emplacement vide en pointillés** « à remplir en lisant », une tasse, etc. Au sommet : une **lampe** (abat-jour dégradé `#C98F3A→#9A6A22` + cône de lumière), une **plante**, un **coussin** `#E9C9A0`, et **Colette** (`mascotte/colette.png`, ~176 px) qui dort dessus, drop-shadow douce.
- **Panneau bas** (feuille crème, radius 26 haut) : barre de niveau « Vers Cabinet de lecture · 820/1000 ✦» (remplissage dégradé ocre→or) ; bouton principal espresso **« J'ai lu aujourd'hui +18 ✦ »** + bouton carré (icône étagère) ; ligne « Colette ronronne · série 12 j » et « 32 p. aujourd'hui ».

### Écran 2 — Boutique
- En-tête « Boutique » / Spectral « Rendez-le douillet » + solde lumens.
- Sections **Lumières** et **Confort**, cartes produit crème (radius 18) : aperçu dessiné, nom, et **prix en lumens** `✦ 240` — sauf objet possédé qui montre « ✓ Installée » en forêt. Objets : Lampe ambrée (installée), Lampe de banquier (240), Guirlande douce (70), Coussin de Colette (110), Plante grimpante (90), Tapis tissé (160).
- Bandeau espresso **« Nouvelle étagère · +12 emplacements »** à `✦ 500`.

### Écran 3 — Défis
- En-tête « Défis » / « Nourrissez la biblio ».
- Cartes de défi crème : titre Spectral 18, **badge de récompense** coloré par tranche (objet, étagère, ou lumens), barre de progression 8 px à la couleur de la tranche, « X / Y ». Un défi terminé a un bord ocre + bouton **« Récupérer »**. Exemples : « 7 jours d'affilée → Lampe ambrée » (5/7), « Terminer 3 essais → +1 étagère » (2/3), « 500 pages ce mois → +200 ✦ » (312/500), « Ajouter 5 livres → Coussin » (5/5, à récupérer).

### Écran 4 — Évolution
Trois cartes montrant le coin **Jour 1** (étagère nue, 3 livres, « tant de place… »), **Semaine 4** (se garnit, lampe allumée, plante), **Mois 3** (plein, chaud, Colette au sommet) — pour vendre la progression.

### Données à concevoir (proposition Supabase)
- `profiles.lumens int default 0`, `profiles.nook_level int default 1`.
- `nook_items` (catalogue : id, kind `light|comfort|shelf`, name, price_lumens, asset).
- `user_nook_items` (user_id, item_id, installed bool) — possession + placement.
- `user_shelves` (capacité d'étagères débloquée → nb d'emplacements).
- **Gains de lumens** : crédités côté serveur (RPC) à la validation d'une journée / fin de livre / défi — même endroit que le rollup `daily_reading` déjà existant (voir `use-reading-sessions.ts`, l'RPC qui recompute l'objectif du jour). Garder l'esprit **anti-honte** : on gagne, on ne perd jamais de lumens passivement.
- **Défis solo** : étendre le modèle `challenges` existant (`goal_type pages|books`, `target`) avec une récompense (`reward_kind`, `reward_value`) et `claimed_at`.
- Respecter le réglage **`prefs.gamification`** (`@/features/settings/use-display-prefs`) : si désactivé, ne pas afficher la couche jeu (comme `DailyGoalCard`/`DailyGoalMini` aujourd'hui).

### Mascotte Colette
Illustration au trait **déjà dans le projet** (`mascotte/colette.png`, + version animée 60 images `mascotte/colette-anim.gif`). Ne pas la redessiner en SVG — utiliser l'asset. La version animée convient à un widget « coin vivant ».

---

## Design tokens (déjà dans `biblio/src/theme/tokens.ts`)
| Rôle | Hex | Token |
|---|---|---|
| Fond parchemin | `#EFE6D3` | `palette.paper` |
| Surface carte | `#FBF6EC` | `palette.paperCard` |
| Filet | `#EAE2D1` | `palette.hairline` |
| Piste de progression | `#E4DAC7` | `palette.track` |
| Encre (titres, sous-titres) | `#2A1E15` | `palette.espresso` / `ink` |
| Texte corps | `#3A362F` | `palette.inkSoft` |
| Texte secondaire | `#8C8479` | `palette.concrete` |
| Brique (partiel / alertes) | `#AE4133` | `palette.brick` |
| Prussien (en cours) | `#225F77` | `palette.prussian` |
| Forêt (objectif atteint) | `#2D6B4E` | `palette.forest` |
| Ocre (récompenses) | `#B5832E` | `palette.gold` |

**Tokens neufs pour le jeu** (à ajouter) : lumen/or `#D8A23E` (et clair `#E0B262`), lampe `#C98F3A`→`#9A6A22`, fond coin `#F3EAD6`→`#E4D2B4`, bois étagère `#E7D7B9`, pastille série `#F1E7D3`/`#E6D7B8`, nuit `#221B14`/`#15110C`. Rappels : radius carte 18–28, pastille 999, anneau trait 11 (héro) / 3.4 (mini).

## Assets
- **Colette** : `mascotte/colette.png` (+ `mascotte/colette-anim.gif`, 60 images) — déjà dans le projet, à réutiliser tel quel.
- **Lampes, plantes, tapis, étagère, livres** : dessinés en CSS dans les maquettes (formes simples + dégradés). À reproduire en composants RN/SVG, ou à remplacer par de petites illustrations cohérentes avec Colette.
- **Icônes** : pack maison `PackIcon` (`flame`, `check`, `openBook`…), pas d'emoji.
- Polices Spectral + Schibsted Grotesk déjà chargées dans l'app.

## Files
**Références de design (ce bundle)** — ouvrir avec `support.js` à côté :
- `Colophon - Objectif du jour.dc.html` — A, version large + mobile
- `Colophon - Coin lecture (jeu).dc.html` — B, 4 écrans
- `mascotte/colette.png`, `mascotte/colette-anim.gif` — la mascotte
- `support.js` — runtime des `.dc.html`

**Fichiers du codebase concernés (`biblio/`)** :
- `src/components/reading/DailyGoalCard.tsx` — **cible du redesign A** (Ring, WeekStrip, MonthGrid, YearRings, presets déjà présents)
- `src/components/reading/DailyGoalMini.tsx` — version compacte (en-tête Accueil) à aligner sur le nouveau style
- `src/features/reading/use-daily-goal.ts` — données (inchangé)
- `src/features/reading/widget-sync.ts` — sync widget iOS (inchangé)
- `src/app/(app)/(tabs)/profile.tsx` — monte `<DailyGoalCard>` quand `prefs.gamification`
- `src/features/settings/use-display-prefs.tsx` — toggle `gamification`
- `src/features/social/use-challenges.ts` + `src/components/circle/ChallengesSection.tsx` — base à étendre pour les défis récompensés (B)
- `src/features/profile/badges.ts` — badges de série (cohérence avec le jeu)
- `src/theme/tokens.ts` — palette (ajouter les tokens « jeu »)
- **Nouveau (B)** : `src/features/nook/*` (économie lumens + boutique) et `src/components/nook/*` (scène, boutique, défis, évolution) à créer.
