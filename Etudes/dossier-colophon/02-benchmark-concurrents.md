# 02 — Benchmark concurrentiel

*« Mangacollec des livres » : scan ISBN, catalogage de ce qu'on possède, suivi de lecture, étagères, tags, prêts, cercles de lecture, stats, partage public, tendances communautaires. Mobile + web.*

Données de marché 2025-2026. Positionnement de Colophon : application **francophone, design-first, centrée sur la possession (ownership)** — un croisement entre un gestionnaire de collection physique (Mangacollec) et un tracker de lecture social (StoryGraph).

---

## 1. Goodreads — le géant vieillissant à détrôner

**Positionnement.** Le réseau social de lecture historique (lancé en 2007, racheté par **Amazon en 2013**). Effet de réseau massif, base de données gigantesque, et standard de facto pour la note moyenne d'un livre.

**Fonctionnalités phares.** Étagères (« shelves »), note sur 5 étoiles entières uniquement, critiques, Reading Challenge annuel, groupes, recommandations, scan de code-barres, giveaways.

**Modèle économique.** Gratuit, monétisé par la **publicité** et le sponsoring (et le renvoi vers Amazon). Pas d'offre payante grand public.

**Forces.** Catalogue et masse critique d'utilisateurs imbattables ; la note Goodreads fait autorité ; import/export facile.

**Faiblesses (très documentées en 2025).** Infrastructure non modernisée depuis 2007 ; recherche défaillante ; appli boguée ; note 5 étoiles « entières » jugée trop pauvre ; **review-bombing** non modéré (plaintes répétées d'auteurs) ; UI « beige et lente » ; Amazon n'a aucune incitation à l'améliorer. Bloomberg (juillet 2025) titrait que Goodreads « oublie pourquoi il existe ». La migration des lecteurs s'accélère à chaque frustration.

**À retenir pour Colophon.** La frustration Goodreads est *le* moteur de croissance de tous les concurrents. À copier : l'effet réseau, l'import facile, le Reading Challenge. À ne PAS reproduire : note binaire, modération laxiste, UI datée, dépendance Amazon. **L'indépendance vis-à-vis d'un retailer** est un argument de vente.

---

## 2. The StoryGraph — le challenger data-driven

**Positionnement.** L'alternative anti-Amazon dominante, fondée par Nadia Odunayo. A **dépassé 5 millions de lecteurs en janvier 2026**, croissant à chaque scandale Goodreads.

**Fonctionnalités phares.** Suivi **mood + pace** (adventurous, funny, tense, emotional, dark, cozy / fast-paced vs slow-burner), **notes au quart d'étoile (0,25)**, content warnings communautaires, recaps mensuels/annuels riches, **buddy reads spoiler-free**, défis personnalisés, import Goodreads.

**Modèle.** Freemium. **Plus : ~4,99 $/mois ou ~49,99 $/an** (stats avancées, recommandations illimitées, « Up Next », filtres exclusifs, création de buddy reads). Revenus B2B propres : **giveaways auteurs/éditeurs (99 $ standard, 499 $ premium)**. Pas de pub dans le feed, pas de vente de données. IA optionnelle et désactivable.

**Forces.** Profondeur statistique inégalée ; éthique (anti-Amazon, anti-pub) ; mood/pace différenciant ; communauté militante.

**Faiblesses.** Design fonctionnel mais peu chaleureux ; courbe d'apprentissage des stats ; social plus faible que Fable ; anglophone, peu de catalogue FR.

**À emprunter.** Le **mood/pace tracking** et les **content warnings** sont devenus des attentes de marché. La **note au quart d'étoile**. Le modèle freemium « Plus stats » + revenus éditeurs propres. Mais Colophon peut surpasser StoryGraph sur le **design** et l'**ownership** (StoryGraph track la lecture, pas la collection physique).

---

## 3. Hardcover — l'alternative moderne et transparente

**Positionnement.** Fondé en 2021, équipe indé. « Goodreads sans Amazon », orienté découverte sociale + tracking détaillé. Roadmap publique, rapports dev mensuels, transparence des revenus.

**Fonctionnalités phares.** 4 statuts de lecture (dont **DNF**), demi-étoiles, **confidentialité par livre** (public / amis / privé), listes custom partageables, feed « For You », **« Wrapped » annuel**. Recommandations basées sur les **patterns réels — explicitement SANS IA générative** (revendiqué comme un atout).

**Modèle.** Gratuit sans plafond sur le tracking. **Supporter : 4,99 $/mois ou 49,99 $/an** (édition librarian, support, perks Discord).

**Forces.** Transparence radicale ; pas d'IA générative ; confidentialité granulaire ; éthos communautaire.

**Faiblesses.** Petite échelle ; catalogue et social en construction ; anglophone.

**À emprunter.** La **transparence** (roadmap publique) crée une fidélité forte chez les early adopters. Le **statut DNF**, la **confidentialité par livre**, le **Wrapped annuel**. Le débat « IA ou pas IA » est un axe de positionnement : Colophon peut choisir l'IA **optionnelle** plutôt que subie.

---

## 4. LibraryThing — la profondeur catalographique

**Positionnement.** L'outil des collectionneurs sérieux et bibliothécaires (depuis 2005). Référence du **catalogage** plus que du social.

**Fonctionnalités phares.** Import via **Z39.50 depuis 1 000+ bibliothèques** → métadonnées riches ; séries, genres, recommandations, « Common Knowledge », fonctions « librarian ». Décline **TinyCat**, un SIGB léger pour petites bibliothèques (≤ 20 000 items) : self-checkout, circulation, inventaire, rapports.

**Modèle.** LibraryThing gratuit. **TinyCat : gratuit perso, à partir de 3 $/mois pour les pros.**

**Forces.** Qualité et profondeur des métadonnées inégalées ; communauté de bibliothécaires ; sérieux du catalogage (séries, éditions, désambiguïsation).

**Faiblesses.** UI vieillissante ; pas grand public ni mobile-first ; social et design négligés.

**À emprunter.** La **profondeur du modèle de données** (gérer les **éditions** distinctes d'un même livre, les séries, les œuvres collectives). Le **Z39.50 / sources bibliothèques** (en France : BnF, Electre, ABES/SUDOC). Les **features prêt/circulation** de TinyCat valident la pertinence du suivi de **prêts** dans Colophon.

---

## 5. Babelio — la référence française

**Positionnement.** Le « Goodreads français » (depuis 2007). **~2,1 millions de membres (2025)**. Incontournable pour la promotion littéraire en France.

**Fonctionnalités phares.** Critiques, citations, extraits, notes, **challenges de lecture** (ABC des auteurs/titres, Atout Prix, Multi-défis), **Masse Critique** (livres gratuits en avant-première contre critique, sessions par genre), **Prix Babelio**, quiz, listes.

**Modèle.** **Publicité des maisons d'édition** + services payants de promotion aux éditeurs. Partenariats : **Place des Libraires (Tite Live, 1 120 librairies indé)**, widgets bibliothèques.

**Forces.** Communauté FR massive et active ; catalogue francophone profond ; Masse Critique = mécanique d'engagement gagnant-gagnant ; ancrage dans l'écosystème du livre français.

**Faiblesses.** UI/UX et appli datées ; **faible sur la possession/collection physique** (site de critiques, pas un gestionnaire de bibliothèque) ; pas de stats riches ; scan ISBN absent.

**À emprunter — et où l'attaquer.** Babelio est **le concurrent FR direct** mais vulnérable sur le design et l'ownership. À copier : **Masse Critique** (acquisition + relation éditeurs = modèle de revenus FR), **challenges**, partenariats **libraires indépendants**. À surpasser : mobile-first, **scan ISBN**, gestion de la **collection physique**, stats, design.

---

## 6. Sens Critique — le multi-média français

**Positionnement.** Plateforme FR de notation/critique **multi-média** (cinéma, séries, jeux, **livres & BD**, musique). Nouvelle appli fin 2024 étendant Films/Séries aux Livres et BD.

**Fonctionnalités phares.** Notes, critiques, **sondages**, **tops** et listes communautaires, feed, classements annuels.

**Forces.** Identité forte, communauté culturelle exigeante ; le multi-média crée du cross-over ; **tops et sondages** très engageants.

**Faiblesses.** Le livre est **secondaire** vs cinéma/séries ; pas de collection ni de scan ; tracking inexistant.

**À retenir.** Les **sondages et tops communautaires** (« meilleurs polars 2025 ») sont un format de **tendances communautaires** plus ludique que de simples graphiques — pertinent pour le pilier « community trends » de Colophon.

---

## 7. Mangacollec — le modèle explicite de Colophon

**Positionnement.** Le gestionnaire de **collection physique** de référence pour manga/BD en France. Centré sur **ce que tu possèdes**.

**Fonctionnalités phares.** Ajout à la collection, **scan de code-barres**, **planning personnalisé des sorties** (basé sur tes séries → alertes nouveaux tomes), onglet **« Envies » (wishlist)** avec listes auto-générées, **panier/liste d'achat**, suivi par **série** (tomes possédés vs manquants).

**Modèle.** Gratuit + **Premium** (sauvegarde cloud, mises à jour hebdo des plannings, **cocher les tomes lus** par série, rangement personnalisé). Liens d'achat (Amazon, BDfugue).

**Forces.** Excellence sur la **completion de collection** (« il me manque le tome 7 ») ; **planning de sorties** = rétention exceptionnelle (raison de rouvrir l'app chaque semaine) ; wishlist/panier naturelle ; UX mobile soignée.

**Faiblesses.** Verticalisé manga/BD uniquement ; pas de social ni de critiques ; tracking basique (lu/pas lu).

**À emprunter — c'est l'ADN.** Le **suivi par série avec tomes possédés/manquants** est absent de tous les trackers « livres ». Le **planning des sorties** = moteur de rétention n°1. La **wishlist auto-générée** et le **panier**. Le modèle **Premium** (cloud, plannings, organisation) est éprouvé. **Colophon = appliquer ce savoir-faire collection au livre généraliste** (romans, essais, beaux livres), où personne ne le fait bien.

---

## 8. Bookwyrm — le pari fédéré et indé

**Positionnement.** Réseau de lecture **décentralisé, open-source, sur ActivityPub** (interopère avec Mastodon). Auto-hébergeable.

**Fonctionnalités phares.** Tracking, critiques, suivi d'amis, **listes** (ouvertes/curées/privées), **groupes** collaboratifs, fédération inter-instances.

**Forces.** Souveraineté des données ; pas de pub ni d'Amazon ; communautés de niche ; RGPD-friendly par nature.

**Faiblesses.** Fragmentation (catalogues dispersés) ; barrière technique ; pas de mobile natif soigné.

**À retenir.** La **souveraineté des données** et l'absence d'Amazon résonnent fort en Europe. Sans aller jusqu'au fédéré (trop complexe grand public), Colophon peut capitaliser sur **hébergement EU, RGPD, export ouvert, pas de revente** comme promesse de marque.

---

## 9. Oku — le minimalisme design-led

**Positionnement.** Tracker **design-forward, minimaliste**. Découverte sociale via les lecteurs dont on aime le goût.

**Fonctionnalités phares.** Listes, critiques & recommandations, **collections custom**, suivi d'amis, **import Goodreads**, objectifs + stats (premium).

**Forces.** Esthétique soignée, épurée ; web + mobile cohérents.

**Faiblesses.** Social léger ; pas de gestion de collection physique ; notoriété limitée.

**À retenir.** Oku prouve qu'**un design supérieur seul peut différencier** dans cette catégorie saturée d'UI moches. Référence directe pour le pilier « design-led » de Colophon. Mais Oku ne fait **pas** l'ownership — espace libre.

---

## 10. Bookly & Basmo — les trackers d'habitude

**Bookly.** Centré **sessions de lecture chronométrées** : timer, vitesse, **temps estimé pour finir**, **streaks, badges, objectifs quotidiens**, infographies partageables (aimé sur BookTok). **Pro : 4,99 $/mois, 29,99 $/an.** Critique : **paywall agressif (limite 10 livres en gratuit)**, bugs de timer.

**Basmo.** Tracker d'habitude + **sessions, OCR pour capturer des citations**, **ChatBook (assistant IA)**, intégrations **Kindle & Notion**. **Pro : 4,99 $/mois ou 39,99 $/an.** Gratuit limité.

**À emprunter.** Les **sessions chronométrées, streaks, badges et infographies partageables** = engagement quotidien + viralité BookTok. L'**OCR de citations** est un bonus différenciant. **Leçon négative : paywall trop agressif** (limite 10 livres) — Colophon doit garder le **catalogage de base gratuit et illimité** et ne facturer que stats/cloud.

---

## 11. Fable & Italic Type — la nouvelle vague sociale/esthétique

**Fable.** Plateforme mobile de **book clubs** animés par des BookTokkers, buddy reads, **chapter/episode rooms spoiler-free** (livres ET séries), annotations in-book temps réel, prompts de discussion, streaks, stats. **Plus : 5,99 $/mois.** (Polémique IA 2024 sur des recaps générés — prudence.)

**Italic Type.** Tracker **« for joy »** : épuré, **sans pub, indé**, social « cosy et intime » (pas un feed infini). Import Goodreads/StoryGraph, **book boards privés**, clubs virtuels. **Gratuit**, ad-free.

**À retenir.** Deux directions opposées : (a) **social/communautaire fort** (Fable) → valide les **cercles de lecture** de Colophon ; (b) **cosy/intime, anti-feed-infini** (Italic Type) → tendance « peace over pings ». Colophon doit choisir un **ton** : social **chaleureux et maîtrisé** plutôt qu'un clone d'Instagram.

---

## 12. Matrice de fonctionnalités

| Fonctionnalité | Colophon (cible) | Goodreads | StoryGraph | Hardcover | LibraryThing | Babelio | Mangacollec | Bookwyrm | Oku | Fable | Italic Type | Bookly |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Scan ISBN** | ✅ cœur | ✅ | ✅ | ➖ | ✅ | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Collection / possession** | ✅ cœur | ➖ | ➖ | ➖ | ✅✅ | ➖ | ✅✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Suivi par série (tomes manquants)** | ✅ cœur | ➖ | ➖ | ➖ | ➖ | ➖ | ✅✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Planning des sorties** | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ✅✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Étagères / tags custom** | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ | ➖ | ✅ | ✅ | ➖ | ✅ | ➖ |
| **Prêts (qui a mon livre)** | ✅ | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Mood / pace** | ✅ | ➖ | ✅✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Notes fines (¼/½ étoile)** | ✅ | ➖ | ✅ | ✅ | ✅ | ➖ | ➖ | ✅ | ✅ | ✅ | ✅ | — |
| **Stats / recap annuel** | ✅ | ➖ | ✅✅ | ✅ | ➖ | ➖ | ➖ | ➖ | ✅(P) | ✅ | ➖ | ✅ |
| **Sessions chrono / streaks** | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ | ✅✅ |
| **Cercles / book clubs** | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | ➖ | ✅ | ➖ | ✅✅ | ✅ | ➖ |
| **Partage public profil** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | ✅ | ✅ | ✅ | ➖ |
| **Tendances communautaires** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅✅ | ➖ | ➖ | ✅ | ✅ | ✅ | ➖ |
| **Métadonnées FR** | ✅✅ | ➖ | ➖ | ➖ | ✅ | ✅✅ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| **Mobile + web** | ✅✅ | ✅ | ✅ | ✅ | ✅(web) | ✅ | ✅(mob) | ✅(web) | ✅ | ✅(mob) | ✅ | ✅(mob) |
| **Indépendant d'Amazon** | ✅✅ | ❌ | ✅ | ✅✅ | ➖ | ✅ | ➖ | ✅✅ | ✅ | ✅ | ✅✅ | ✅ |

*✅✅ = point fort majeur · ✅ = présent · ➖ = absent/faible · (P) = premium*

---

## 13. Patterns de monétisation

1. **Freemium « Plus stats »** — modèle dominant. Catalogage de base gratuit et illimité ; on facture **stats avancées, recommandations, cloud, organisation fine**. Ancrage marché : **~4,99 $/mois, ~40-50 $/an**.
2. **Premium « collection »** (Mangacollec) — cloud, plannings, tomes lus, rangement. Pertinent pour le pilier ownership.
3. **Paywall sur l'usage = à éviter** — la limite de 10 livres de Bookly est la critique n°1. Ne jamais bloquer le **catalogage de base**.
4. **Revenus B2B propres** — **giveaways auteurs/éditeurs** et **Masse Critique**. Voie FR la plus naturelle (pas de pub dans le feed).
5. **Affiliation libraire** — **Bookshop.org** (anglo) ; **en France : Place des Libraires / Lalibrairie.com / Decitre / libraires indé**, jamais Amazon — cohérent avec le positionnement design-led et éthique.
6. **Dons / transparence** (Hardcover, Bookwyrm) — fidélise les early adopters indés.
7. **À éviter** : pub intrusive, revente de données (rejet RGPD/Europe).

---

## 14. White space / opportunités de différenciation

1. **L'ownership du livre généraliste.** Mangacollec maîtrise la collection physique mais *seulement BD/manga*. **Aucun acteur livre généraliste ne gère bien « ce que je possède »** : tomes manquants, éditions distinctes (poche/grand format/collector), doublons, état, valeur. **LE white space central de Colophon.**
2. **Suivi par série + planning des sorties pour les romans.** Sagas fantasy/SF/polar, intégrales, cycles : personne ne fait pour le roman ce que Mangacollec fait pour le manga.
3. **Gestion de la bibliothèque physique IRL.** Localisation (étagère, pièce), **prêts**, inventaire, valeur, état. LibraryThing/TinyCat le font en outil pro/moche ; Colophon peut le rendre **grand public et beau**.
4. **Design-led FR.** Babelio/Sens Critique dominent le FR avec une UX datée ; Oku/Italic Type sont beaux mais anglophones et sans ownership. **Une app FR aussi belle qu'Oku + aussi profonde que Mangacollec = case vide.**
5. **Souveraineté des données / éthique EU.** Anti-Amazon, hébergement EU, RGPD, export ouvert.
6. **Affiliation pro-libraires indépendants FR.** Aligné avec la loi Lang et les valeurs du lectorat français.
7. **Cercles de lecture « cosy »** entre le bruit de Fable et l'austérité de Babelio.
8. **Bridge physique/numérique** : scan → fiche enrichie (BnF/Electre) → collection → stats → social → achat libraire. Un parcours unifié que personne n'offre de bout en bout en français.

**Synthèse stratégique.** Colophon = **« le Mangacollec du livre »** : l'app qui prend au sérieux ce qu'on *possède* (collection, séries, éditions, prêts, planning), là où tout le monde ne track que ce qu'on *lit* — en exécution **design-first** absente du marché FR, avec une **éthique anti-Amazon/RGPD** et un **modèle freemium « Plus stats » + Premium collection + affiliation libraires indé**.

---

## Sources

- StoryGraph : [site](https://thestorygraph.com/) · [Plus](https://app.thestorygraph.com/plus) · [Wikipedia](https://en.wikipedia.org/wiki/The_StoryGraph) · [monétisation](https://www.wearefounders.uk/how-does-storygraph-make-money/)
- Hardcover : [review](https://bookwiseapp.com/blog/hardcover-app) · [tracking 2026](https://yourbookfriend.com/2025/11/26/how-to-track-your-reading-in-2026-goodreads-alternatives-and-comparisons/)
- Goodreads : [Bloomberg](https://www.bloomberg.com/opinion/articles/2025-07-01/amazon-s-goodreads-is-forgetting-why-it-even-exists) · [The Bookseller](https://www.thebookseller.com/news/goodreads-faces-further-criticism-from-authors-over-trolls-and-homophobic-reviewers) · [Countercraft](https://countercraft.substack.com/p/goodreads-has-no-incentive-to-be)
- LibraryThing : [site](https://www.librarything.com/) · [TinyCat](https://www.librarycat.org/) · [pricing](https://www.capterra.com/p/268527/TinyCat/)
- Babelio : [site](https://www.babelio.com/) · [Challenges 2025](https://www.babelio.com/article/2952/Challenges-de-lecture-Babelio-2025--le-guide) · [Masse Critique](https://www.babelio.com/article/1542/tout-ce-quil-faut-savoir-sur-masse-critique) · [franceinfo](https://www.franceinfo.fr/culture/livres/la-rentree-litteraire/ecrire-un-bon-livre-ne-suffit-plus-comment-babelio-est-devenu-un-incontournable-tremplin-vers-le-succes-litteraire_7697944.html)
- Sens Critique : [sondages](https://www.senscritique.com/livres/sondages) · [App Store](https://apps.apple.com/fr/app/senscritique/id6738689514)
- Mangacollec : [App Store](https://apps.apple.com/fr/app/mangacollec/id1178656045) · [Premium](https://blog.mangacollec.com/2022-02-26-launch-premium)
- BookWyrm : [site](https://joinbookwyrm.com/) · [GitHub](https://github.com/bookwyrm-social/bookwyrm)
- Oku : [site](https://oku.club/) · [pricing](https://oku.club/pricing)
- Fable : [site](https://fable.co/) · [club features](https://fable.co/club-features) · [Publishers Weekly](https://www.publishersweekly.com/pw/by-topic/digital/Apps/article/93818-as-fable-grows-the-mobile-book-club-platform-adds-personalization-features.html)
- Italic Type : [site](https://www.italictype.com/) · [App Store](https://apps.apple.com/us/app/italic-type-easy-book-tracker/id6462011660)
- Bookly : [site](https://getbookly.com/) · [review](https://bookwiseapp.com/blog/bookly-review-the-reading-timer-app-that-builds-real-habits) · Basmo : [site](https://basmo.app/reading-tracker/)
- Panoramas : [ISBNDB 24 apps](https://isbndb.com/blog/book-tracking-apps-and-websites/) · [Screvi 2026](https://screvi.com/blog/best-book-tracking-apps-2026)
