# Étude UX / UI — Colophon

> Audit complet de **toutes les pages** de l'app contre le design system « Les tranches ».
> Date : 30 juin 2026 · Méthode : 7 agents UX en parallèle (un par groupe d'écrans),
> lecture du code + `AGENTS.md`. 24 écrans, ~70 constats. Cible App Store (iOS/iPad/Mac/Web/Android).

---

## 1. Résumé exécutif

Colophon est **visuellement abouti et très cohérent** : le design system « Les tranches »
(parchemin/nuit, espresso, 4 tranches, Spectral + Schibsted, couvertures-héros) est appliqué
avec discipline. Les composants unifiés (`KPITile`, `BarList`, `SectionLabel`, `Card`, `Screen`)
tiennent toute l'app. Les états riches (chargement, vide, succès) sont souvent soignés. Rien
de cassé n'a été trouvé — l'app est **prête pour le store** ; les constats ci-dessous sont des
**finitions de qualité**, pas des bloqueurs.

Le travail restant n'est **pas par écran** mais **transverse** : les mêmes ~10 patterns
reviennent partout. La bonne nouvelle : quelques **composants partagés** (un `BackLink`, un
wrapper `maxWidth`, un relèvement systématique des cibles tactiles) corrigent la majorité des
constats **d'un seul coup**, sur 10-15 écrans à la fois.

**Verdict** : 🟢 expédiable. Priorité aux 4 chantiers P0 (cibles tactiles, bouton retour,
largeur desktop, contraste) — fort levier, faible coût, surface large.

> ⚠️ **Vérification** : les constats viennent d'agents lisant le code ; tous ne sont pas
> exacts. Exemple corrigé en cours d'étude : le constat « clé `upcoming.want` manquante »
> est **faux** — la clé existe (`translations.ts:301` FR `♡ Envie`, `:588` EN `♡ Want`).
> **Vérifier chaque constat avant correction.**

---

## 2. Les 10 thèmes transverses (par levier décroissant)

### T1 — Cibles tactiles < 44 px (le constat #1, quasi omniprésent) 🔴
La règle iOS HIG / WCAG 2.5.5 (≥ 44×44 px) est franchie sur beaucoup d'éléments tactiles :

| Écran | Élément | Taille actuelle |
|---|---|---|
| FilterPanel | puces de facette | h 28 |
| Bibliothèque | `SizeControl` (XXS…L) | h 36 / minW 30 |
| Bibliothèque | puces possession | h 28 |
| File (`queue`) | reorder ↑ ↓ ✕ | 32×32 |
| Cercle | onglets `SegTab` | h 34 |
| Profil | presets objectif | h 40 |
| ShareProfileSheet | boutons cercle | h 46 |
| Mes lieux | « + anecdote » | h 28 |
| ~10 écrans | liens `‹ Retour` | `Text`, pas de padding (~15-30 px) |

**Correctif** : relever `minHeight`/`minWidth` à 44 (ou padding équivalent). Pour les liens
texte, voir T2.

### T2 — Bouton « retour » incohérent & non-accessible (~10 écrans) 🔴
Le `‹ Retour` / `‹` est tantôt un `Text` `onPress`, tantôt un `Pressable hitSlop` — or
`hitSlop` **n'a aucun effet sur React Native Web**. Aucun n'a `accessibilityRole='button'`
ni label ; le glyphe `‹` n'est pas sémantiquement un bouton.
Écrans : discover, queue, upcoming, circle, u/[id], readers, feed, carte, mes-lieux.

**Correctif (1 composant → 10 écrans)** : créer `components/ui/BackLink.tsx` —
cible 44 px, icône ←, `accessibilityRole='button'` + label, padding web-safe, repli
`router.canGoBack() ? back() : replace('/')`. Remplacer tous les retours maison.

### T3 — Accessibilité lecteurs d'écran (exigence App Store) 🟠
- `Pressable`/`Text` cliquables sans `accessibilityRole`/`accessibilityLabel`.
- Toggles **maison** (Profil confidentialité, daily-goal) au lieu de `Switch` natif / `role='switch'`.
- Anneau SVG (DailyGoalCard) + barres (TasteProfileCard) + couvertures `BookCover` **sans label**.
- Onglet Scan : lu « bouton 3 ». Modales sans `role='dialog'`.
- Changements d'état dynamiques sans `accessibilityLiveRegion` (« Posté dans … », message objectif).

**Correctif** : passer les props d'accessibilité ; préférer `Switch` ; labelliser couvertures/anneaux.

### T4 — i18n incomplet (textes FR en dur) 🟠
EN partiellement livré, mais beaucoup de chaînes restent codées en dur → le switch FR/EN les
laisse en français. Foyers : Profil (`Ça traîne`, `Confidentialité`, `Collection`, descriptions
confidentialité, libellés du formulaire d'en-tête), ShareProfileSheet (titre, « Poster dans un
cercle »), `queue` (tout), `SearchPanel` (« Rechercher », message d'erreur), hints de scan.

**Correctif** : extraire vers `i18n/translations.ts` (clés `profile.*`, `queue.*`, `share.*`, `search.*`).

### T5 — Adaptation desktop / grands écrans (pas de `maxWidth`) 🟠
Sur large (iPad paysage, Mac, 1920 px) le contenu s'étale pleine largeur, illisible :
`SeriesAddSheet` & `AddSheet` (overlays plein écran), `queue`, `upcoming`, `feed` (couvertures
trop petites). Profil : `padH = (width-900)/2` → marges démesurées. Bibliothèque : cap à 1200
(espace mort au-delà).

**Correctif** : un wrapper partagé `maxWidth ~600-800, alignSelf:'center'` pour les écrans
scroll/détail ; clamp du Profil.

### T6 — Adaptation mobile (iPhone SE 375 / < 360) 🟠
`KPIRow` 3 tuiles serrées/tronquées < 480 px ; lignes de stats `u/[id]` ; hint ISBN du scan
s'enroule sur 6-8 lignes ; modales trop hautes (AddSheet/ShareSheet `maxHeight`) ; login titre
44 px + logo 132 px dominent le petit écran.

**Correctif** : `KPIRow` `flexWrap`/colonne < 400 px ; raccourcir les hints ; modales `maxHeight 85%`
+ scroll interne.

### T7 — Contraste WCAG AA (4.5:1) 🟠
- `colorMuted` (#8C8479) sur `backgroundStrong` < 4.5:1 (Profil, Badges, nom d'auteur des bulles).
- Texte `%` en couleur tranche (ocre/forêt sur papier) marginal (TasteProfileCard, DailyGoal).
- `ModeCard` actif `surfaceWarmAlt` ~1.5:1. Anneau objectif : track ~2:1.

**Correctif** : texte muted → `colorSoft` ; `%` tranche en poids 700-800 ou variantes foncées ;
état actif `ModeCard` en accent plein (espresso sur papier).

### T8 — États vides / chargement / erreur 🟡
Retours `null` silencieux (pas de distinction chargement vs vide) : TasteProfileCard, DailyGoalCard,
Profil (Prêts/Doublons/Ça-traîne) ; pas de **retry** sur erreur (u/[id], feed, search) ; pas de
spinner sur suggestions readers/feed ; Bibliothèque « aucun résultat » sans bouton « Effacer les filtres ».

**Correctif** : distinguer les 3 états ; ajouter retry + « effacer les filtres ».

### T9 — Hiérarchie visuelle « plate » 🟡
Partout des Labels 11 px majuscules, sans titres Spectral → sections Profil monotones ; titres
d'étagères identiques (sans accent tranche) ; sign-up sans `ColophonMark` ; Support sans CTA contact
above-the-fold.

**Correctif** : `SectionTitle` Spectral optionnel ; titres d'étagères colorés par tranche ; logo sur sign-up.

### T10 — Finitions interaction 🟡
FilterPanel `+`/`−` → chevron animé ; File sans drag-and-drop + sans undo au retrait ; overlay
AddSheet opacité 0.45 (faible) ; en-tête cercle « Inviter/Quitter » déborde < 380 px ; ambiguïté
action primaire sur Carte.

---

## 3. Plan d'action priorisé

### P0 — avant la prochaine soumission (fort levier, faible coût)
1. **`BackLink` partagé** (T2) — corrige le retour + une grande part de T1 sur ~10 écrans d'un coup.
2. **Cibles tactiles ≥ 44** (T1) — chips, `SizeControl`, `SegTab`, reorder, presets.
3. **Wrapper `maxWidth` partagé** (T5) — queue / upcoming / feed / sheets + clamp Profil.
4. **Contrastes texte** (T7) — muted → soft ; `%` tranche en poids/variantes.

### P1
5. Props a11y (`role`/`label`) + `Switch` natif + alt couvertures (T3).
6. Extraire les textes FR en dur (T4).
7. `KPIRow` responsive + hints + hauteurs de modale (T6).
8. États loading/empty/error distincts + retry (T8).

### P2
9. Hiérarchie Spectral + accents d'étagères (T9).
10. Drag-drop file, undo, chevrons FilterPanel, polish (T10).

---

## 4. Audit détaillé par écran

Sévérité : 🔴 high · 🟠 medium · 🟡 low. (Constats complets dans le journal du workflow ;
ci-dessous la synthèse actionnable.)

### Authentification
- **login** — 🟠 titre 44 px déséquilibre / pas de logo responsive ; 🔴 pas de retour natif ;
  🟡 lien « mot de passe oublié » < 44 px ; 🟡 pas de feedback de succès avant redirection.
- **sign-up** — 🔴 sans `ColophonMark` (perte de marque vs login) ; 🟠 pas de validation client
  (email/longueur) → aller-retour serveur ; 🟠 bascule « vérifiez vos e-mails » sans transition.
- **reset-password** — 🔴 pas de « redemander un lien » si token expiré ; 🟠 pas de toggle voir/masquer ;
  🟠 message d'erreur = placeholder réutilisé.

### Accueil & Bibliothèque
- **LibraryHome** — 🟠 « Vous venez de lire » (vouvoiement) vs ton tutoyant ; 🟠 hero masqué si
  pas de lecture en cours (pas de placeholder « commencer ») ; 🟡 avatar peu signalé cliquable.
- **Bibliothèque (index)** — 🔴 3 contrôles filtre/affichage dispersés (charge cognitive) ;
  🔴 `SizeControl` < 44 ; 🟠 titres d'étagères sans accent tranche ; 🟠 « aucun résultat » sans
  « effacer les filtres » ; 🟡 cap 1200 px (espace mort desktop).
- **FilterPanel** — 🔴 ligne accordéon sans `minHeight` ; 🟠 puces 28 px ; 🟠 `+`/`−` au lieu de chevron.

### Profil
- **Profil (écran)** — 🔴 « flatness » (pas de titres Spectral) ; 🔴 toggles maison / focus invisibles ;
  🔴 `padH` desktop démesuré (clamp à ~800) ; 🟠 textes en dur (`Ça traîne`, `Confidentialité`, `Collection`) ;
  🟠 contraste `colorMuted` ; 🟠 `ModeCard` actif peu contrasté.
- **TasteProfileCard** — 🟠 « Partager » petit/secondaire ; 🟡 `%` en couleur tranche (contraste) ;
  🟡 1 colonne sur desktop (whitespace).
- **BadgesCard** — 🟠 ~10 badges/ligne sur desktop (dilué) ; 🟠 tuiles non focusables si rendues cliquables.
- **ShareProfileSheet** — 🔴 modale sans `role`/labels + état « Posté » sans `aria-live` ;
  🟠 titre/labels en dur ; 🟠 boutons cercle 46 px.
- **ProfileHeader** — 🔴 champs `$background` peu contrastés / radius incohérent (12 vs 16) ;
  🔴 « Modifier » = `Text` (pas bouton) ; 🟠 labels de formulaire en dur.
- **DailyGoalCard** — 🟠 anneau SVG + message sans label/`aria-live` ; 🟠 contraste track faible.

### Livre & Découverte
- **discover/[isbn]** — 🔴 pile de pastilles sans hauteur max (trou avant le résumé) ; 🟠 `‹ Retour` < 44 ;
  🟠 « 78 % pour toi » ambigu (préciser « compatibilité ») ; 🟠 pas de contexte de provenance.
- **AddSheet** — 🔴 overlay `rgba(0,0,0,.45)` faible sur OLED/desktop ; 🟠 pas de `maxHeight`/scroll ;
  🟠 couverture 54 px minuscule sur desktop ; 🟠 pas de `gap` entre les 3 boutons.
- **SeriesAddSheet** — 🔴 overlay plein écran sans `maxWidth` ; 🔴 bouton d'action `absolute` risque
  d'être hors-vue ; 🟠 checkboxes sans `role` ; 🟠 message vide peu contextuel.

### Scan, File, À venir
- **Scan (manuel/recherche/import)** — 🔴 cibles import serrées (CSV/Import/Input proches) ;
  🟠 `padH` asymétrique mobile ; 🟠 hint ISBN s'enroule ; 🟠 pas de barre de progression sur import en masse.
- **SearchPanel** — 🟠 bouton « Rechercher » en dur (pas `t()`) + feedback disabled flou ; 🟠 erreur générique ;
  🟡 pas de pagination (scroll infini).
- **File (queue)** — 🔴 reorder ↑↓✕ 32 px ; 🔴 pas de drag-and-drop (20 taps pour réordonner) ;
  🟠 pas d'undo au retrait ; 🟠 textes en dur ; 🟠 pas de `maxWidth` desktop.
- **À venir (upcoming)** — 🟠 « auteurs favoris » sans limite (voir N de plus) ; 🟠 labels série grisés
  (peu visibles) ; 🟠 pas de feedback groupé après plusieurs ajouts ; 🟠 pas de `maxWidth`.
  *(NB : le constat « clé `upcoming.want` manquante » est un **faux positif** — la clé existe.)*

### Social
- **Discussions** — 🟠 état vide « pas encore d'amis » non distingué ; 🟠 avatars amis < 44 ;
  🟡 badge requêtes mieux en pastille ; 🟡 « Créer » vs « Rejoindre » hiérarchie ambiguë.
- **Cercle (circle/[id])** — 🔴 `SegTab` 34 px ; 🔴 retour `‹` 24 px sans label ; 🟠 en-tête déborde < 380 ;
  🟠 chargement messages sans contexte/pagination ; 🟡 contraste nom d'auteur.
- **Profil lecteur (u/[id])** — 🔴 `‹ Retour` minuscule ; 🟠 ligne de stats serrée < 400 px ;
  🟠 pas de retry si introuvable ; 🟡 séparateur 1 px peu visible ; 🟡 avatar sans label.
- **Readers** — 🟠 `‹ Retour` < 44 ; 🟠 espace vide sur desktop (centrer) ; 🟠 intro trompeuse
  (« thématiques » vs genres) ; 🟡 pas de loading sur suggestions.
- **Feed** — 🟠 `‹ Retour` < 44 ; 🟠 couvertures 52 px petites sur desktop ; 🟡 reviews coupées à 4 lignes
  sans « … » ; 🟡 pas de badge non-lu sur l'entrée « Fil ».

### Lieux, Tendances, Divers
- **Tendances** — 🟠 `KPIRow` 3 tuiles serrées < 480 px ; 🟡 `padH` mobile ; 🟡 pluriel inline ; 🟡 BarList sans label a11y.
- **Carte** — 🔴 retour `hitSlop` inopérant web < 44 ; 🟠 deux boutons d'accès hiérarchie ambiguë ; 🟡 en-tête serré mobile.
- **Boîtes à livres** — 🔴 emplacement non éditable si géoloc échoue ; 🟠 Input+Bouton serrés < 380 ;
  🟠 padding 24 généreux mais réduit le lisible mobile ; 🟡 compteur peu visible.
- **Mes lieux** — 🟠 titres de section quasi invisibles (11 px) ; 🟠 édition d'anecdote serrée (préférer un sheet) ;
  🟡 boutons anecdote 28 px ; 🟡 guillemets mixtes FR/EN.
- **Partage public (s/[token])** — 🟠 colonnes sans safe-area inset ; 🟡 pas de « Bibliothèque de [nom] » ; 🟡 couvertures sans label.
- **Support** — 🟠 pas de CTA contact above-the-fold ; 🟡 `padH` mobile ; 🟡 H/P non sémantiques sur web (pas de `<h2>`).
- **Tab bar (_layout)** — 🔴 hauteur incohérente iOS/Android (+ inset) ; 🟠 focus ring strip casse le clavier web ;
  🟡 labels 11 px tronquent < 375 ; 🟡 onglet Scan sans label a11y.

---

## 5. Points forts à préserver
- Cohérence du design system « tranches » sur toute l'app (composants unifiés, tokens, thèmes clair/sombre).
- Couvertures-héros : l'UI recède réellement, la couleur vient des livres.
- États de succès/feedback souvent excellents (badge « Ajouté ✓ », opacité 0.55, compteurs « N/Y »).
- Responsive grid de la bibliothèque (calcul de colonnes précis, 5 tailles).
- Copie française chaleureuse et soignée (« Quelques secondes, et vos livres ont une maison »).

---

*Généré à partir d'un audit multi-agents (7 agents, ~500 k tokens). Réviser chaque constat
avant correction — privilégier les composants partagés (BackLink, wrapper maxWidth, cibles 44)
pour un maximum de surface corrigée au minimum d'effort.*
