# Palette refresh — patch `src/theme/tokens.ts`

Objet : rendre l'interface **plus chaleureuse, un peu plus vive et moderne** (l'aizome marine + les neutres greige rendaient l'ensemble terne), et surtout **rendre les statuts de lecture lisibles** — sur iPad/écran moyen, *En cours* (marine), *Lu* (encre) et *À lire* (gris) étaient trois tons sombres indistinguables. Solution : un statut = **une teinte franche** (notamment **Lu en vert**).

> Ces valeurs **remplacent** celles du `README.md` (accent / papier / statuts). Tout le reste du système (typo, espacements, rayons, ombres) est inchangé. Migration purement cosmétique : éditer les constantes, aucune migration DB.

## 1. Accent — indigo plus vif (« encre vive »)
```diff
- aizome: '#2B3A55',
- aizomeDeep: '#1F2A40',
- aizome08: 'rgba(43,58,85,0.08)',
- aizome10: 'rgba(43,58,85,0.10)',
- aizome16: 'rgba(43,58,85,0.16)',
+ aizome: '#2E3E9C',          // indigo encre — plus saturé, plus moderne
+ aizomeDeep: '#20276E',
+ aizome08: 'rgba(46,62,156,0.08)',
+ aizome10: 'rgba(46,62,156,0.10)',
+ aizome16: 'rgba(46,62,156,0.16)',
```

## 2. Papier & filets — plus crème, plus chaleureux
```diff
- paper: '#F4F1EA',
- paperCard: '#FBFAF6',
+ paper: '#F4EEDF',           // fond d'app, plus crème
+ paperCard: '#FDFAF1',       // cartes / surfaces doc
- hairline: '#E4DFD4',
- hairlineOnPaper: '#E7E0D2',
+ hairline: '#E6DDC9',
+ hairlineOnPaper: '#E8DEC8',
```
Barre de nav translucide (là où elle est codée en dur) : `rgba(244,241,234,0.92)` → `rgba(245,239,224,0.92)`.
Surfaces macOS (si build desktop) : sidebar `#F3EBD7`, barre de titre `#ECE3CD`.

## 3. Statuts de lecture — une teinte par statut *(le correctif clé)*
`statusColors` dans `tokens.ts` :
```diff
  to_read:  {
-   dot: '#6E6A62', chipBg: 'rgba(110,106,98,0.10)', chipText: '#6E6A62'
+   dot: '#8C8479', chipBg: 'rgba(140,132,121,0.12)', chipText: '#7C7468'   // taupe clair — « en attente »
  },
  reading:  {
-   dot: '#2B3A55', chipBg: 'rgba(43,58,85,0.10)',  chipText: '#2B3A55'
+   dot: '#2E3E9C', chipBg: 'rgba(46,62,156,0.10)', chipText: '#2E3E9C'     // indigo — « actif »
  },
  read:     {
-   dot: '#1C1A17', chipBg: 'rgba(28,26,23,0.08)',  chipText: '#1C1A17'
+   dot: '#5A7D52', chipBg: 'rgba(90,125,82,0.16)', chipText: '#4F6E47'     // vert — « terminé »
  },
  abandoned:{
    dot: '#B65D3C', chipBg: 'rgba(182,93,60,0.12)', chipText: '#B65D3C'     // terracotta — inchangé
  },
```
Résultat : taupe clair · indigo · vert · terracotta = **4 teintes nettement distinctes**, lisibles même en pastille de 6–7 px.

**Recommandations complémentaires (lisibilité)**
- Sur l'écran **Profil → « Par statut »** et dans les **vues liste**, augmenter la pastille à **8–9 px** et, idéalement, garder le **libellé** à côté (déjà le cas sur Profil).
- *À lire* peut rester en **anneau évidé** (centre vide) plutôt que plein, pour renforcer la sémantique « pas encore commencé » (cf. mock « Pastilles de statut »).

## 4. Couleur de possession (rappel)
L'**ochre `#B0853A`** reste réservé à l'axe **possession / Envies (wishlist)** — à ne jamais confondre visuellement avec les statuts de lecture ci-dessus. (Voir `IMPLEMENTATION-PLAN.md` §1.)

## 5. Où ça s'applique automatiquement
Tout passe par les tokens → la grille, la fiche, les filtres, le profil « par statut », les rails de progression et les onglets actifs se mettent à jour sans toucher aux composants. Vérifier seulement les rares endroits où une couleur est **codée en dur** (rechercher `#2B3A55`, `#1C1A17` utilisé comme *fond de pastille de statut*, `#F4F1EA`).
