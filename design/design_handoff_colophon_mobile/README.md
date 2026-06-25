# Handoff — Colophon (application mobile)

## Overview
**Colophon** est une application de gestion de bibliothèque personnelle et de suivi de lecture (équivalent de Mangacollec pour les livres « classiques » : romans, essais, beaux‑livres). Direction artistique **wabi‑sabi / japonaise‑méditerranéenne** : papier chaud, encre, béton ciré, bois clair. L'interface s'efface pour mettre les **couvertures** en valeur, comme l'accrochage d'une exposition. Sobre, premium, intemporel.

Ce bundle couvre **le flux mobile complet** (iOS, avec parité Android) :
Connexion → Bibliothèque (grille + liste) → Fiche livre → Scan EAN → Tendances → Discussions → Profil. La Bibliothèque desktop (web) est également incluse en référence (sidebar + grille large), déclinée en deux accents pour comparaison.

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML** — des prototypes qui montrent l'intention visuelle et comportementale, **pas du code de production à copier tel quel**. La tâche est de **recréer ces écrans dans l'environnement cible** avec ses patterns établis. Aucune base de code n'existe encore : la stack recommandée est **React Native (Expo)** pour le mobile iOS + Android, et **React (Vite)** pour le web desktop, en partageant un module de design tokens commun (couleurs, typo, espacements). À défaut, tout framework équivalent convient — l'essentiel est de respecter les tokens et la hiérarchie ci‑dessous.

Le fichier maître est un « Design Component » (`.dc.html`) : un canevas (pan/zoom) qui regroupe tous les écrans sous forme de cadres iOS / Android / navigateur. Ouvrez‑le dans un navigateur pour explorer. Les cadres d'appareils (`ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx`) sont **uniquement l'habillage** (bezel, status bar) — ils ne font pas partie du produit. Le composant `BookCover.dc.html` est, lui, un vrai composant produit (voir plus bas).

## Fidelity
**Haute‑fidélité.** Couleurs, typographie, espacements et tailles sont définitifs. Recréez l'UI au pixel près avec les librairies de l'environnement cible. Les seuls éléments « placeholder » volontaires : les avatars (cercles à initiales) et les photos de couverture réelles (remplacées par des couvertures composées, voir Assets).

---

## Design Tokens

### Couleurs
**Surfaces & papier**
- Papier chaud (fond d'app) `#F4F1EA`
- Papier clair (cartes / surfaces doc) `#FBFAF6`
- Blanc (bulles, cartes contrastées) `#FFFFFF`
- Surface tiède (rows internes) `#F7F4EC` · `#EDE7DA`
- Filets / hairlines `#E4DFD4` (principal) · `#EFEADF` (léger) · `#E7E0D2` (sur papier) · `#DDD6C8` (marqué)

**Encre & béton ciré**
- Encre (texte principal) `#1C1A17`
- Encre douce (corps) `#3A362F`
- Béton foncé `#6E6A62`
- Béton clair / muted `#9B968C` · `#B3AC9F` · `#C3BCAC`
- Béton « header » (en‑têtes Profil & Discussions) `#8B8779` (texte blanc dessus)
- Tracks de progression (rail) `#E0DACD`

**Accent**
- Indigo aizome (accent principal) `#2B3A55` — profond `#1F2A40`
- Teintes aizome : `rgba(43,58,85,0.08)`, `rgba(43,58,85,0.10)`, `rgba(43,58,85,0.16)`
- **Bleu Klein** (accent alternatif, à comparer) `#2A3BFF` — montré sur la Bibliothèque desktop. *Décision par défaut : aizome. Klein documenté pour comparaison.*

**Signal (rare — statuts/alertes)**
- Terracotta `#B65D3C`
- Vert sauge (tendance ▲ / positif) `#7E8A6F`
- Lueur du faisceau de scan `#6E86C8`

### Statuts de lecture (pastilles)
| Statut | Couleur point | Pastille (chip) |
|---|---|---|
| À lire | `#6E6A62` (anneau, centre vide) | fond `rgba(110,106,98,0.10)`, texte `#6E6A62` |
| En cours | `#2B3A55` (plein) | fond `rgba(43,58,85,0.10)`, texte `#2B3A55` |
| Lu | `#1C1A17` (plein) | fond `rgba(28,26,23,0.08)`, texte `#1C1A17` |
| Abandonné | `#B65D3C` (plein) | fond `rgba(182,93,60,0.12)`, texte `#B65D3C` |

### Typographie
- **Serif éditoriale — Spectral** (Google Fonts). Titres, titres de livres, chiffres d'affichage, notes en italique. Poids 500 (titres), 400 italique (signatures/notes).
- **Grotesque UI — Schibsted Grotesk** (Google Fonts). Interface, libellés, données. Poids 400 / 500 / 600.
- Échelle :
  - Display — Spectral 500 · 40 px · letter‑spacing ‑0.02em
  - Titre de livre — Spectral 500 · 22–25 px
  - Titre de section — Spectral 500 · 18 px
  - Corps — Schibsted 400 · 15 px · line‑height 1.5–1.6
  - UI — Schibsted 500 · 14 px
  - Étiquette (label) — Schibsted 600 · 11 px · UPPERCASE · letter‑spacing 0.20em · couleur `#9B968C`
  - Donnée — Schibsted 500 · 13 px · `font-variant-numeric: tabular-nums`
- Les **titres sur les couvertures** utilisent des unités relatives au conteneur (`cqw`) pour rester nets à toute taille.

### Espacement, rayons, ombres
- Espacement base‑4 : 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Rayons : **2 px par défaut** (boutons, champs, couvertures), 0, 8, 14–16 (cartes/bulles/feuilles), 999 (pastilles & avatars). Feuilles qui remontent : haut arrondi 22–24.
- Ombres :
  - Carte : `0 1px 3px rgba(28,26,23,0.08)`
  - Flottant : `0 4px 14px rgba(28,26,23,0.10)`
  - Modal / hero : `0 12px 30px rgba(28,26,23,0.14)`
  - Couverture (objet livre) : `0 1px 2px rgba(28,26,23,0.13), 0 9px 24px rgba(28,26,23,0.14)`

---

## Composants produit

### BookCover (héros) — voir `BookCover.dc.html`
Couverture composée typographiquement (palette de la marque). Ratio **2:3** (67/100), rayon 2 px. Props :
- `title`, `author`, `tag` (ex. « ROMAN », « ESSAI »), `bg`, `fg`, `layout`.
- `layout` ∈ { `champ` (aplat, titre haut, signature basse), `filets` (titre centré encadré de filets), `bande` (bandeau d'imprimeur en tête) }.
- Traitement « objet physique » : ombre portée feutrée, dégradé de tranche à gauche (7 %), filet intérieur 1 px (`inset 0 0 0 1px rgba(0,0,0,0.08)`).
- État sélectionné : liseré aizome 2 px à ‑6 px + pastille de coche.
- **Remplaçable par une vraie photo** (recadrage auto 2:3), récupérée au scan ISBN ; sinon repli composé.

Palette des couvertures de démonstration (bg / fg) : Éloge de l'ombre `#26231F`/`#E8E0CF` · Les Villes invisibles `#2B3A55`/`#EFE9DC` · L'Été `#B65D3C`/`#F6EFE2` · Pays de neige `#DCD6C8`/`#1C1A17` · Le Pavillon d'or `#B0853A`/`#211C12` · L'Usage du monde `#7E8A6F`/`#F4EFE2` · Les Vagues `#6E7C8C`/`#F2ECDE` · La Montagne magique `#9B968C`/`#1C1A17` · Les Choses `#E3D7BB`/`#1C1A17` · L'Œuvre au noir `#46384A`/`#EDE4E0` · Le Métier de vivre `#A8603D`/`#F4EADD` · Les Années `#C2A29A`/`#1C1A17` · Les Anneaux de Saturne `#2E4A47`/`#EAE6D8` · Désert `#CBB191`/`#2A241B` · Le Meilleur des mondes `#28324A`/`#E7E2D4`.

### Autres composants
- **Carte de livre — grille** : couverture + titre (Spectral 14–15) + ligne (point de statut + auteur en `#9B968C`) ; pour « en cours », fin rail de progression aizome + libellé.
- **Rangée de livre — liste** : vignette 40–44 px + titre/auteur + note (pastilles) + chip de statut.
- **Pastilles de statut** : point + libellé, et variante chip arrondie (voir tableau Statuts).
- **Onglets d'étagères** : onglets texte, actif = soulignement aizome 2 px + texte encre ; inactif `#9B968C`.
- **Recherche** : champ blanc, bord `#E4DFD4`, rayon 2, loupe à gauche, placeholder « Rechercher un titre, un auteur, un ISBN… ».
- **Filtres / tri** : chips bordés (Étagère ▾ / Statut ▾ / Auteur ▾) ; « Trier : … ▾» à droite ; bascule vue grille/liste (carré actif = aizome plein).
- **Progression de lecture** : grand chiffre Spectral `page / total` + `%` aizome ; rail 3 px (rempli aizome) ; stepper « − [page] + » bordé.
- **Notation** : 5 pastilles 11 px (pleines = note, demi via dégradé 50/50) + valeur Spectral (« 4,5 ») ; état « pas encore noté » = 5 pastilles `#DCD6C8`.
- **Champs de fiche** : label (11 px upper, `#9B968C`) au‑dessus d'une valeur (15 px encre) soulignée par un filet `#E4DFD4` (style « input filet »).
- **Barre de navigation (mobile)** : 5 onglets — **Bibliothèque · Tendances · Scan (cercle aizome 44 px, central) · Échanges (Discussions) · Profil**. Actif = aizome, inactif `#9B968C`. Fond papier translucide `rgba(244,241,234,0.92)` + `backdrop-filter: blur(10px)` + filet haut ; `padding-bottom: 28px` (safe‑area).

---

## Écrans / Views

### 1. Connexion
- **But** : authentification.
- **Layout** : centré, généreux. Motif « tranches de livres » (9 barres verticales colorées de hauteurs variées, alignées sur un filet) ; wordmark **Colophon** (Spectral 42) + baseline italique « Votre bibliothèque, au calme. ».
- **Composants** : champ E‑mail, champ Mot de passe (avec œil), bouton **Se connecter** (aizome plein, rayon 2), séparateur « ou », boutons SSO **Apple** (encre `#1C1A17`) et **Google** (blanc bordé), lien « Pas encore de compte ? **Créer un compte** » (Créer en aizome).

### 2. Bibliothèque — grille (iOS) & 3. liste (iOS) & Android
- **But** : parcourir sa collection ; les couvertures sont les héros.
- **Layout** : en‑tête (surtitre « MA BIBLIOTHÈQUE » + titre **Bibliothèque** Spectral 33 + compteur), champ de recherche, onglets d'étagères (Toutes / En cours / Romans / Essais / Beaux‑livres), ligne compteur + tri. Grille **3 colonnes** (gap 16/14) de couvertures + légende (titre Spectral 13 + point statut + auteur). **Vue liste** alternative : rangées vignette + titre/auteur + statut. **Android** : mêmes contenus, recherche en pilule, chips d'étagères pleines, **FAB scan** en bas à droite, nav Material.
- **Copy** : « 142 livres », placeholders, etc.

### 4. Fiche livre (iOS) — *cadrage Figma Screen‑13*
- **But** : tout sur un livre + suivi.
- **Layout** : héros (grande couverture sur fond béton `#E7E2D6`, retour + ⋯), **feuille blanche `#FBFAF6` qui remonte** (rayon haut 24, marge ‑26). Contenu : titre (Spectral 25) + auteur italique + métadonnées (« Actes Sud · 1995 · 371 pages ») ; chip statut + note ; **Progression** (24 % · p. 88/371, rail) ; **Sessions de lecture** (liste : « p. 72 → 88 · 18 juin · 28 min ») ; **Étagères** (chips bordés) ; **Exemplaire** (Emplacement / État / Achat, champs filet) ; **Note** (Spectral italique). **CTA fixe** en bas : « Reprendre · p. 88 » (aizome) + bouton « + Session » bordé.

### 5. Scan EAN (iOS, sombre) — caméra
- **But** : ajouter des livres par code‑barres, en rafale, avec repli ISBN.
- **Layout** : plein écran sombre (`radial-gradient` `#2C2A24`→`#121009`, status bar claire). Barre haute translucide (fermer ✕, « Scanner un livre », flash). **Viseur** central : 4 équerres claires, code‑barres indicatif estompé, **ligne de scan** lumineuse (`#6E86C8`, glow). Hint « Alignez le code‑barres dans le cadre ». **Feuille papier** en bas (rayon haut 22) : **Rafale · 3 livres** (vignettes scannées + pastille de coche + emplacement vide) ; actions « Saisir l'ISBN » (bordé) + « Terminer · 3 » (aizome).

### 6. Tendances (iOS) — *cadrage Figma Screen‑23*
- **But** : découverte des livres en vogue.
- **Layout** : titre **Tendances** + sélecteur de période « Cette semaine ▾ ». **Carte vedette N°1** (couverture 74 + surtitre terracotta « N°1 cette semaine » + titre + auteur + note pastilles + « ▲ +1,2k »). **Classement** : rangées rang (Spectral, `#C3BCAC`) + vignette 40 + titre/auteur + note + indicateur ▲/—/▼ (sauge / béton / terracotta).

### 7. Discussions (iOS) — *cadrage Figma Screen‑3 (vue conversation)*
- **But** : échanger au sein d'un cercle de lecture (vue fil/détail, avec retour).
- **Layout** : **en‑tête béton** `#8B8779` (retour, « Cercle Sebald » + « Les Anneaux de Saturne · 8 membres », ⋯, rangée d'avatars membres superposés), rayon bas 24. **Conversation** : séparateur « Aujourd'hui » ; **bulles entrantes** (avatar + nom·heure, bulle blanche rayon 14 14 14 4) et **bulles sortantes** (aizome, texte papier, rayon 14 14 4 14, alignées à droite, heure dessous). **Champ de saisie** fixe en bas (pilule « Écrire dans le cercle… » + bouton envoi aizome) — *remplace la nav onglets car c'est une vue détail.*

### 8. Profil (iOS) — *cadrage Figma Screen‑6*
- **But** : identité du lecteur + statistiques (objectif, compteurs).
- **Layout** : **en‑tête béton** `#8B8779` (retour, « PROFIL », ⋯, avatar à initiales 104 px, « Camille Roy » + « Marseille, France »), rayon bas 30. **Carte stats** qui chevauche (3 colonnes : 489 Livres / 103 Lus en 2024 / 31k Pages). **Objectif 2024** (103/120, rail aizome 86 %, « 17 livres d'avance »). **Lus récemment** : grille 3 colonnes de couvertures avec dégradé de fondu en bas + « Tout voir ». Nav 5 onglets (Profil actif).

### Référence desktop (web) — Bibliothèque
- Fenêtre navigateur. **Sidebar 250 px** (wordmark Colophon ◆, sections Bibliothèque / Étagères, liens Statistiques & Scanner), **zone principale** (recherche + filtres + tri + bascule grille/liste, titre « Toutes » + compteur, **grille 6 colonnes**). Déclinée **deux fois** : accent **aizome** et accent **Klein** — pour trancher la décision d'accent.

---

## Interactions & Behavior
- **Navigation** : 5 onglets persistants en mobile (Bibliothèque, Tendances, Scan, Discussions, Profil). Le Scan ouvre la caméra plein écran. Les vues détail (Fiche, conversation de cercle) se présentent en push avec un **retour**, masquant la barre d'onglets au profit d'un CTA / champ de saisie fixe.
- **Bibliothèque** : recherche temps réel ; filtres (étagère / statut / auteur) ; tri (ajouts récents, titre, auteur, année, note) ; bascule grille ↔ liste ; tap couverture → Fiche.
- **Fiche** : changement de statut (à lire → en cours → lu / abandonné) ; mise à jour de la page courante (stepper) qui recalcule % et crée une **session** ; note par pastilles ; ajout/retrait d'étagères ; édition des champs d'exemplaire ; CTA « Reprendre » incrémente la session.
- **Scan** : flux caméra → détection EAN‑13 → ajout à la file de rafale (vignette + coche) → « Terminer » crée les entrées. Repli « Saisir l'ISBN » (clavier numérique). Flash on/off.
- **Tendances** : sélecteur de période ; tap → Fiche.
- **Discussions** : fil temps réel d'un cercle ; saisie + envoi ; bulles entrantes/sortantes ; mention d'objectifs de lecture du cercle.
- **Profil** : progression d'objectif annuel ; accès aux étagères / réglages.
- **Transitions** : feutrées et brèves (~180–220 ms, easing doux). Une seule révélation orchestrée au chargement vaut mieux que des micro‑animations dispersées. Pas d'effets clinquants.
- **Cibles tactiles** ≥ 44 px.

## State Management
- **Bibliothèque** : `books[]` — `{ id, title, author, publisher, year, pages, coverArt|coverColors+layout, status, currentPage, rating, shelves[], location, condition, purchase, note, sessions[] }`. `session = { date, fromPage, toPage, durationMin }`.
- **Utilisateur** : profil (nom, lieu, avatar), compteurs dérivés (livres, lus année, pages), **objectif annuel** (cible, courant).
- **Scan** : file de rafale `scanQueue[]` (ISBN/EAN → métadonnées résolues), état flash.
- **Cercles / Discussions** : `circles[]` (livre, membres) et `messages[]` (auteur, texte, heure, sortant/entrant).
- **Tendances** : classement par période (rang, note, delta).
- **UI** : onglet actif, mode grille/liste, filtres & tri courants, accent de thème (aizome | klein).

## Design Tokens — résumé machine
```
color.paper            #F4F1EA
color.paperCard        #FBFAF6
color.ink              #1C1A17
color.inkSoft          #3A362F
color.concreteDark     #6E6A62
color.concrete         #9B968C
color.headerConcrete   #8B8779
color.hairline         #E4DFD4
color.track            #E0DACD
color.accent           #2B3A55   (aizome)
color.accentDeep       #1F2A40
color.accentAlt        #2A3BFF   (Klein — option)
color.signal           #B65D3C   (terracotta)
color.positive         #7E8A6F
radius.default 2  radius.card 16  radius.sheet 24  radius.pill 999
space  4 8 12 16 24 32 48
font.serif  "Spectral"            (titres, livres, chiffres)
font.sans   "Schibsted Grotesk"   (UI, données)
```

## Assets
- **Polices** : Spectral & Schibsted Grotesk via Google Fonts (libres). Lien `https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Schibsted+Grotesk:wght@400;500;600;700`.
- **Couvertures** : **aucune image sous droits**. Les couvertures sont **composées typographiquement** par le composant `BookCover` (titre + auteur + palette). À remplacer, côté produit, par les photos réelles de l'utilisateur (recadrage 2:3) ou par les visuels récupérés au scan ISBN ; sinon repli composé.
- **Avatars** : placeholders à initiales sur fond coloré (à remplacer par les photos utilisateurs).
- **Icônes** : SVG inline (loupe, chevrons, +, grille/liste, caméra/viseur, éclair flash, bulle, personne, étoiles/pastilles, courbe de tendance, avion d'envoi). Réimplémentables avec n'importe quel set linéaire (trait 1.4–1.6, `currentColor`).
- Les titres/auteurs sont des **données bibliographiques** (œuvres réelles) — librement utilisables ; seules les pochettes originales sont évitées.

## Files
- `Colophon - Direction & Bibliothèque.dc.html` — maître : tous les écrans (canevas pan/zoom) + tokens, typographie et composants documentés visuellement.
- `BookCover.dc.html` — composant couverture (props : title, author, bg, fg, tag, layout).
- `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx` — **habillage d'appareil uniquement** (bezel/chrome), hors produit.
- `support.js` — runtime du format de prototype (non requis dans l'app cible).

> Astuce d'implémentation : commencez par le **module de tokens** (couleurs, type, espacements) puis le composant **BookCover**, puis l'écran **Bibliothèque** — c'est la fondation qui valide toute la direction. Accent par défaut **aizome** ; le **Klein** est fourni si vous préférez un parti plus tranché (comparez sur la Bibliothèque desktop).
