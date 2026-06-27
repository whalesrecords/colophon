# Identité de marque — Colophon

Système de marque dérivé du logo **pile de livres + § (pied-de-mouche)**. À recréer en SVG/vecteur dans l'app (`assets/` + composant `BrandMark`).

## Logo
- **Symbole** : pile de 4 livres en pyramide (de bas en haut : rouge, bleu, vert, ocre) sur une ligne d'étagère espresso, + **médaillon § ** (signe du typographe) en bas à droite, à cheval sur l'étagère.
- **Wordmark** : « Colophon » en **Spectral 600** (serif), `letter-spacing:-0.02em`.
- **Déclinaisons** : icône app (parchemin / nuit), lockup horizontal (clair / sombre), symbole seul.
- **Médaillon** : sur fond clair → cercle espresso `#2A1E15`, § parchemin. Sur fond sombre → cercle parchemin `#F4EEE2`, § nuit. Sur fond sombre, **éclaircir les tranches** (cf. palette).
- **Zone de protection** ≥ hauteur d'une tranche autour du symbole. Taille mini lisible : symbole 24 px / icône 44 px.

## Palette « Les tranches »
Chaque tranche = une couleur, et **le système d'accents de l'app** : une couleur par rayon/collection. Le chrome reste calme (parchemin + espresso) ; la couleur ponctue.

| Nom | Hex (clair) | Hex (sur fond sombre) | Usage |
|---|---|---|---|
| Rouge brique | `#AE4133` | `#C0533C` | Romans · alertes douces |
| Bleu de Prusse | `#225F77` | `#2E78A6` | Essais · *en cours* |
| Vert forêt | `#2D6B4E` | `#3E9460` | Séries · *terminé* |
| Ocre doré | `#B5832E` | `#D8B36A` | Mangas / BD · envies |
| Espresso | `#2A1E15` | — | Marque · § · encre |
| Parchemin | `#F4EEE2` | — | Fond clair |
| Nuit | `#221B14` | — | Fond sombre |

### Mapping vers `src/theme/tokens.ts`
- **Statuts de lecture** s'alignent sur les tranches (lisibilité — cf. `PALETTE-REFRESH.md`) : *en cours* = Bleu de Prusse, *terminé* = Vert forêt, *à lire* = taupe `#8C8479`, *abandonné* = Rouge brique.
- **Possession / Envies** : conserver l'**Ocre** comme signal wishlist.
- **Collections/rayons** : exposer un token `shelfColors` = { romans:'#AE4133', essais:'#225F77', series:'#2D6B4E', mangas:'#B5832E' } ; appliqué aux pastilles de rayon, en-têtes de collection, tranches dans les vues « étagère ».
- **Accent principal de marque** = Espresso `#2A1E15` (et non plus l'indigo) pour la nav active, le wordmark, le médaillon. *(Remplace `aizome` comme couleur de marque ; l'indigo peut rester une des 4 tranches sous le nom Bleu de Prusse.)*

## Typo (rappel)
Spectral (serif éditoriale — marque, titres, chiffres) · Schibsted Grotesk (UI). Inchangé.

## Esprit
Calme, wabi-sabi : formes douces, surfaces papier mates, ombres feutrées. La **gaieté vient des couvertures et des tranches**, jamais de dégradés ou d'effets brillants.

> Référence visuelle : région **« 10 — Identité de marque »** du canvas `Colophon - Direction & Bibliothèque.dc.html` (hero, palette, icônes, lockups).
