# Handoff — Colophon · Multiplateforme & vues P0

## Overview
Ce bundle étend le design existant de **Colophon** (gestion de bibliothèque personnelle + suivi de lecture, direction wabi‑sabi / japonaise‑méditerranéenne) à **trois nouvelles cibles** — **macOS (app native, en profondeur)**, **iPad** et **Web App** — et introduit les **vues produit P0** qui débloquent l'avantage « le Mangacollec du livre » :

1. **Séparer possession et statut de lecture** (P0.1) — écran *Scan · possession en 1 tap*.
2. **Série persistée + vue de complétion** (P0.2) — écrans *Série & complétion* (macOS + iOS).
3. **Wishlist (« Envies ») de premier ordre** (P0.3) — écrans *Envies* (Web App + iOS).

Les écrans mobiles de base (Connexion, Bibliothèque grille/liste, Fiche livre, Scan, Tendances, Discussions, Profil) sont déjà documentés dans le bundle précédent `design_handoff_colophon_mobile/` — **ce dossier ne réexplique que ce qui est nouveau**, et s'appuie sur les **mêmes tokens**.

## About the Design Files
Les fichiers HTML de ce bundle (`Colophon - Direction & Bibliothèque.dc.html`, `BookCover.dc.html`, frames d'appareils) sont des **références de design** — des prototypes qui montrent l'intention visuelle et comportementale, **pas du code de production à copier tel quel**. Ils sont écrits dans un format de prototypage (« Design Component ») et n'ont pas vocation à être exécutés dans l'app.

La tâche est de **recréer ces écrans dans la codebase existante** (`biblio/`, voir `IMPLEMENTATION-PLAN.md`) avec ses patterns établis : **Expo / React Native + React Native Web** (mobile, iPad, Web, macOS Catalyst), **Tamagui** pour le styling, **Supabase** pour les données. La codebase possède déjà un module de tokens (`src/theme/tokens.ts`) et la config Tamagui (`src/theme/tamagui.config.ts`) — **réutilisez‑les, ne redéfinissez rien.**

## Fidelity
**Haute‑fidélité.** Couleurs, typographie, espacements, tailles et comportements sont définitifs. Recréez l'UI au pixel près avec les composants de l'environnement cible. Les seuls placeholders volontaires : avatars (initiales) et couvertures (composées typographiquement par `BookCover`, remplaçables par les photos réelles).

---

## Design Tokens
**Source de vérité : `biblio/src/theme/tokens.ts`** (déjà en place). Rappel des valeurs employées par les nouveaux écrans :

| Rôle | Token | Hex |
|---|---|---|
| Fond papier | `paper` | `#F4F1EA` |
| Carte / surface doc | `paperCard` | `#FBFAF6` |
| Surface chaude sidebar macOS | — | `#F4F0E7` |
| Barre de titre macOS | — | `#EEE8DC` |
| Encre (texte) | `ink` | `#1C1A17` |
| Corps | `inkSoft` | `#3A362F` |
| Muted | `concrete` | `#9B968C` |
| Muted clair | `concreteLight` / `concreteLighter` | `#B3AC9F` / `#C3BCAC` |
| Filet | `hairline` / `hairlineOnPaper` | `#E4DFD4` / `#E7E0D2` |
| Rail progression | `track` | `#E0DACD` |
| **Accent indigo aizome** | `aizome` | `#2B3A55` (tints `…,0.10` / `…,0.16`) |
| **Envie / wishlist** (signal possession) | `ochre` | `#B0853A` |
| Alerte (doublon) | `terracotta` | `#B65D3C` |
| Faisceau de scan | `scanBeam` | `#6E86C8` |

**Accent : décision non tranchée.** L'app par défaut est **aizome**. Le **bleu Klein `#2A3BFF`** reste documenté pour comparaison (écran Bibliothèque desktop, deux variantes). Tous les nouveaux écrans utilisent **aizome**.

**Couleur de possession ⟂ lecture.** L'**ochre `#B0853A`** est réservé à l'axe *possession* (« Envie / wishlist »). Les pastilles de *statut de lecture* gardent leurs couleurs existantes (`statusColors` dans tokens.ts). Ne pas mélanger les deux axes visuellement.

**État de tome (vue Série) — légende :**
- **Lu** : point `#1C1A17` + badge coche encre.
- **Possédé** (non lu) : point `#2B3A55`.
- **Envie** : point `#B0853A` + pastille `ENVIE` ochre.
- **Manquant** : anneau `#C3BCAC`, couverture remplacée par un **fantôme** (cadre pointillé `1.5px dashed #C7C0B1`, hachures `repeating-linear-gradient(135deg, #F0EBDF 0 7px, #ECE6D8 7px 14px)`, numéro romain Spectral `#C3BCAC`).

**Typo** : Spectral (serif éditoriale — titres, titres de livres, chiffres) · Schibsted Grotesk (UI, données). Échelle dans `tokens.ts → typography`.
**Espacement** base‑4 · **Rayons** : 2 défaut, 6–8 (cartes desktop/macOS), 10–12 (cartes mobiles), 16–24 (feuilles), 999 (pastilles). **macOS** : fenêtre rayon 12, feux 12 px (`#ff5f57`/`#febc2e`/`#28c840`).

---

## Screens / Views

### A. macOS — Bibliothèque *(en profondeur)*
- **But** : l'app de bibliothèque sur Mac, paradigme natif **multi‑colonnes** (façon Apple Books / Mail).
- **Layout** : fenêtre `#FBFAF6`, rayon 12, ombre `0 34px 80px rgba(28,26,23,0.30)` + liseré `0 0 0 1px rgba(28,26,23,0.10)`. **Barre de titre unifiée** (h 46, `#EEE8DC`, filet bas `#E4DFD4`) : segment gauche (largeur 240, feux macOS, filet droit `#E7E0D2`) aligné sur la sidebar ; segment droit = chevrons précédent/suivant (mutés), titre de vue (Spectral 16 « Toutes »), champ recherche (240×, `#FBFAF6`, bord `#E4DFD4`, rayon 6), bascule grille/liste (rayon 6, carré actif aizome plein).
- **Sidebar** (240, `#F4F0E7`, filet droit `#E7E0D2`, padding vertical 18) : wordmark `◆ Colophon` (Spectral 19) ; section **BIBLIOTHÈQUE** (label 9.5px upper `#B3AC9F` ls 0.22em) → *Toutes 142* (actif : fond `rgba(43,58,85,0.10)`, texte aizome 600, rayon 6, items margin 0 12 / padding 7×14), *En cours 4*, *À lire 31*, *Lu 103*, *Envies 12* (avec point ochre 6px) ; section **COLLECTIONS** → *Séries 9*, *Romans*, *Essais*, *Littérature japonaise* ; pied (après filet) : *Statistiques*, *Scanner un livre* (icônes linéaires 15px trait 1.6 `#6E6A62`).
- **Contenu** (`#F4F1EA`) : en‑tête (surtitre « MA BIBLIOTHÈQUE » 10px upper `#9B968C` + titre Spectral 32 « Toutes ») aligné à droite avec chips *Statut ▾* (bord, rayon 6) et *Trier : Récents ▾*. **Grille couvertures 6 colonnes**, gap 28×24, padding 36. Carte = `BookCover` (ratio 2:3) + titre Spectral 13.5 + ligne (point statut 6px + auteur `#9B968C`) ; si *en cours*, rail 2px (`#E0DACD` rempli aizome).

### B. macOS — Série & complétion *(KILLER FEATURE · P0.2)*
- **But** : pour une série présente dans ma biblio, voir d'un coup d'œil **tomes possédés / manquants** et compléter la collection.
- **Layout** : même fenêtre + sidebar (item **Séries** actif, sous‑items de séries en retrait 26px : « Les Rougon‑Macquart » aizome 500). Barre de titre : titre Spectral « Les Rougon‑Macquart » + bouton *Ajouter un tome*.
- **Contenu** :
  - **En‑tête série** : surtitre ochre « SAGA · Émile Zola » + titre Spectral 34 + sous‑titre Spectral italique 15 (« Roman‑fleuve en vingt volumes · 1871–1893 »).
  - **Carte de complétion** (droite, 344, `#FBFAF6`, bord `#E7E0D2`, rayon 8) : grand `14 / 20 tomes` (Spectral 30 encre) + `70%` (Spectral 30 aizome) ; **rail 4px** (`#E0DACD` rempli aizome à la largeur du %) ; **légende** 4 états (Lu/Possédé/Envie/Manquant, points 8px aux couleurs ci‑dessus).
  - **Barre d'action** : bouton aizome plein « **Ajouter les 4 manquants aux envies** » (rayon 2, padding 11×18, icône +) + libellé muted « 6 tomes hors collection · 4 manquants, 2 déjà en envie ».
  - **Grille des tomes 5 colonnes** (gap 26×22) : 20 cellules. Tome présent = `BookCover` **uniforme de saga** (`bg #2B3A55`, `fg #EFE9DC`, `layout="filets"`, `tag="TOME {romain}"`, `title=`titre du volume, `author="É. Zola"`) ; **badge coin haut‑droit** (coche encre 21px pour *Lu*, pastille `ENVIE` ochre pour *Envie*). Tome manquant = **fantôme** (cf. tokens). **Légende sous chaque cellule** : point d'état + « Tome {romain} · {état} ».

### C. iPad — Bibliothèque *(aperçu)*
- **But** : montrer la déclinaison tablette (split‑view paysage).
- **Layout** : bezel iPad paysage (rayon 36, châssis `#15130F`, padding 13, point caméra en haut), écran rayon 24. **Sidebar 228** translucide (`rgba(247,244,236,0.86)` + `backdrop-filter: blur(20px)`, filet `#E7E0D2`) : wordmark, champ recherche, sections **BIBLIOTHÈQUE** (Toutes/En cours/Envies) et **COLLECTIONS** (Séries/Romans), pied profil (avatar). **Contenu** : en‑tête (surtitre + titre Spectral 34) + chip tri + bouton scan rond aizome 44 ; **grille 5 colonnes** (gap 26×22). Items sélectionnés rayon 8.

### D. Web App — Envies / wishlist *(P0.3 · POSSESSION ⟂ LECTURE)*
- **But** : la **wishlist** comme vue de premier ordre dans l'app web responsive.
- **Layout** : fenêtre navigateur ; **sidebar 250** (identique au desktop Bibliothèque, item **Envies** actif : fond `rgba(176,133,58,0.12)`, texte `#8A6526` 600, point ochre). **Contenu** (padding 34×40) :
  - En‑tête : surtitre ochre « CE QUE JE VEUX LIRE » + titre Spectral 32 « Envies » + bouton encre plein « Liste d'achat » (icône panier).
  - **Phrase pédagogique** (`#6E6A62`, max 560) : « Les envies ne sont **pas** dans votre collection : ni prix, ni emplacement requis. Possession et statut de lecture sont deux axes distincts. » → matérialise P0.1.
  - **Grille 6 colonnes** de couvertures `BookCover` + **pastille `ENVIE`** ochre (coin haut‑droit) + action « + Ajouter » (chip bord).
  - Section **« Tomes manquants de vos séries »** (titre Spectral 19 + badge compteur terracotta) : rangée de **fantômes** de tomes (Rougon‑Macquart) → un clic pour les ajouter aux envies. Relie wishlist ⟷ complétion de série.

### E. iOS — Envies *(P0.3)*
- **But** : la wishlist sur mobile. **Nouvel onglet « Envies »** dans la barre (icône cœur, actif ochre) — entre Bibliothèque et Scan.
- **Layout** : en‑tête (surtitre ochre + titre Spectral 33 « Envies » + compteur) ; **filtres pilules** (Toutes ochre plein / Séries / Suggérés) ; **grille 3 colonnes** de couvertures + pastille `ENVIE` ; **carte « Liste d'achat »** (`#FBFAF6`, bord `#E7E0D2`, rayon 8 ; pastille ochre + « 4 tomes manquants · à commander chez un libraire » + chevron). Barre d'onglets : *Biblio · **Envies** · Scan(central aizome) · Échanges · Profil*.

### F. iOS — Série & complétion *(P0.2)*
- **But** : version mobile de la vue Série (push avec retour).
- **Layout** : en‑tête (retour rond + « SÉRIE » ; surtitre ochre + titre Spectral 27) ; **carte complétion** (`#FBFAF6`, rayon 10) `14 / 20 tomes` + `70%` + rail + légende 4 états ; **grille 3 colonnes** de tomes (covers saga uniformes + badges Lu/Envie, fantômes pour manquants, légende « T. {romain} » centrée) ; **CTA fixe** bas (feuille papier translucide) « Ajouter les 4 manquants aux envies » (aizome plein).

### G. iOS — Scan · possession en 1 tap *(P0.1)*
- **But** : à la détection EAN, choisir **possession** en 1 tap, indépendamment du statut de lecture, avec **détection de doublon**.
- **Layout** : caméra plein écran sombre (`radial-gradient #2C2A24→#121009`), viseur 4 équerres + ligne de scan `#6E86C8` (glow). **Bannière doublon** (pilule terracotta `rgba(182,93,60,0.92)`) : « **Tu possèdes déjà ce livre** ». **Feuille papier** basse (rayon haut 22) : vignette + titre/éditeur du livre résolu ; label « JE L'AJOUTE COMME… » ; **3 boutons** côte à côte : *Je le possède* (aizome plein), *Je le veux* (bord, icône cœur ochre), *Emprunté* (bord) ; ligne « Statut de lecture : **À lire** ▾ » (axe lecture séparé, pré‑rempli, modifiable).

---

## Interactions & Behavior
- **macOS / iPad / Web** : sidebar persistante ; sélection d'une section recharge le contenu ; bascule grille/liste ; recherche temps réel ; tri (récents/titre/auteur/année/note). Tap couverture → fiche livre. Transitions feutrées ~180–220 ms.
- **Série & complétion** : « Ajouter les N manquants aux envies » crée N items `ownership='wishlist'` rattachés à la série ; tap d'un tome présent → fiche du tome ; tap d'un fantôme → ajouter (possède / envie).
- **Envies** : « + Ajouter » bascule l'item de `wishlist` → `owned` (ouvre éventuellement la fiche exemplaire) ; « Liste d'achat » génère une liste exportable (liens libraire indé, hors Amazon).
- **Scan possession** : détection EAN → résolution métadonnées (cascade Google Books → Open Library → BnF existante) → **détection doublon locale** (cache collection) → choix possession 1 tap → l'entrée est créée ; le statut de lecture est indépendant et pré‑rempli « À lire ».
- **Cibles tactiles** ≥ 44 px ; tout est **désactivable / opt‑in** (garde‑fous wabi‑sabi : calme, anti‑pression, anti‑lock‑in).

## State Management
Axes **orthogonaux** (cœur de P0.1) :
- **Possession** (sur l'exemplaire) : `ownership ∈ { owned | wishlist | borrowed }` (+ `borrowed_from`, `due_back`).
- **Lecture** (événement) : `status ∈ { to_read | reading | read | dnf }`.
- **Série** : entité `series { id, title, kind, total_volumes }` ; `book_metadata.series_id` + `series_position` ; dérivés `ownedCount / total`, `missing[]`, `%`.
- **Envies** : vue dérivée `items WHERE ownership='wishlist'` + tomes manquants des séries suivies + propositions de cercles.
- **UI** : section active, mode grille/liste, filtres/tri, breakpoint (compact mobile / regular iPad‑desktop / macOS).

→ Modèle de données cible et migrations Supabase détaillés dans **`IMPLEMENTATION-PLAN.md`**.

## Assets
- **Polices** : Spectral & Schibsted Grotesk (Google Fonts, libres) — déjà chargées via `@expo-google-fonts` dans la codebase.
- **Couvertures** : composées par `BookCover` (aucune image sous droits) ; pour une **saga**, design uniforme (même `bg/fg`, `layout="filets"`, numéro de tome en `tag`). Remplaçables par photos réelles / visuels récupérés au scan.
- **Icônes** : SVG inline linéaires (trait 1.4–1.6, `currentColor`) — réimplémentables avec le set d'icônes de la codebase (`src/components/icons.tsx`).

## Files
Références de design incluses dans ce bundle :
- `Colophon - Direction & Bibliothèque.dc.html` — **canevas maître** : tokens, typo, composants + **tous les écrans**, dont la nouvelle région « 08 — Multiplateforme » (macOS, iPad, Web App, vues P0). Ouvrir dans un navigateur (pan/zoom).
- `BookCover.dc.html` — composant couverture (props `title, author, bg, fg, tag, layout ∈ {champ, filets, bande}`).
- `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx` — **habillage d'appareil uniquement** (hors produit).
- `support.js` — runtime du format de prototype (non requis dans l'app).
- **`IMPLEMENTATION-PLAN.md`** — plan d'implémentation détaillé sur la codebase `biblio/` (migrations, features, routes, composants, breakpoints).
