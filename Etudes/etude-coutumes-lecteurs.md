# Coutumes réelles des lecteurs et usages des applications de lecture
## Étude UX pour Colophon (bibliothèque personnelle + suivi de lecture)

*Étude documentaire, données 2022-2026. Les implications UX concrètes pour Colophon sont signalées par ➜ tout au long du document.*

---

## 0. Cadrage : à qui s'adresse une app comme Colophon

Le marché des apps de lecture s'est radicalement reconfiguré depuis le rachat de Goodreads par Amazon. Goodreads reste le mastodonte (plus de 150 millions de membres), mais sa croissance repose largement sur l'inertie et le verrouillage des données plutôt que sur la qualité du produit. En face, **The StoryGraph** a dépassé les **5 millions d'inscrits** (janvier 2026), avec ~3,8 millions d'utilisateurs actifs en 2025, en se positionnant comme l'alternative sans pub, design soigné, centrée sur l'analyse personnelle. **Fable** (racheté par Scribd) revendique plus d'un million d'utilisateurs et 100 000+ clubs de lecture. **Hardcover**, **LibraryThing**, **CLZ Books** et **iCollect Books** occupent des niches (social ouvert, catalogage, collectionneurs).

Enseignement central : il n'existe **pas un seul type de lecteur-utilisateur**, mais au moins quatre profils dont les besoins divergent et parfois s'opposent :

| Profil | Besoin dominant | Risque si mal servi |
|---|---|---|
| **Le « tracker » data** | Stats, dashboards, comprendre ses habitudes | Fuit si l'app est lente/laide (cf. Goodreads) |
| **Le social/BookTok** | Partage, recommandations, clubs, buddy reads | Fatigue sociale, surcharge |
| **Le collectionneur / propriétaire** | Cataloguer, éviter les doublons, gérer prêts/éditions | Abandonne si la saisie est pénible |
| **Le lecteur minimaliste** | Logger sans noter ni commenter, sans pression | Part si l'app le force à « performer » |

➜ **Implication structurante Colophon** : l'app doit être *modulaire et désactivable*. Le social, les notes, les challenges, les stats doivent pouvoir être masqués pour ne pas effrayer le lecteur minimaliste ni le collectionneur. Colophon a un atout différenciant rare : l'**ownership** (la possession physique), mal couvert par Goodreads/StoryGraph et abandonné aux apps de catalogage froides type CLZ.

---

## 1. Comportements de suivi de lecture (tracking)

### Qui suit, et pourquoi

Le tracking n'est pas universel. Aux États-Unis, l'adulte moyen *commence* 12,6 livres par an mais n'en *termine* que ~5 ; plus de la moitié (52 %) des adultes déclarent ne pas avoir lu un livre entier sur l'année. Le suivi formalisé est donc le fait d'une **minorité engagée** — la cible naturelle d'une app comme Colophon — pour qui le tracking remplit trois fonctions :

1. **Mémoire** : « ai-je déjà lu ce livre ? l'ai-je aimé ? » (fonction la plus universelle et la moins « performative »).
2. **Compréhension de soi** : voir évoluer ses goûts, genres, rythmes dans le temps. C'est le cœur de la promesse StoryGraph (« helps you understand yourself as a reader »).
3. **Motivation/accomplissement** : barre de progression, objectif annuel, bilan de fin d'année.

### Ce qu'on suit réellement

- **Dates** (début / fin de lecture) : donnée la plus demandée, base de toutes les stats et des bilans annuels.
- **Pages** : utilisées comme proxy d'effort ; StoryGraph et Goodreads calculent « pages lues » dans leurs wrap-ups.
- **Format** : papier / ebook / audio. Distinction de plus en plus structurante avec l'essor de l'audio (les Boomers, gros liseurs, sous-consomment l'audio ; les jeunes l'adoptent). Un même titre peut être possédé en plusieurs formats.
- **Temps de lecture** : suivi plus rare, souvent abandonné car trop pénible à saisir manuellement.
- **Re-lectures** : peu d'apps les gèrent bien. Beaucoup de lecteurs *relisent* leurs livres-doudous et veulent pouvoir logger une 2ᵉ/3ᵉ lecture avec une nouvelle date et éventuellement une nouvelle note — sans écraser la première.

➜ **Colophon** : modéliser une lecture comme un **événement daté répétable** (une entrée par session de lecture d'un même exemplaire), pas comme un statut binaire « lu/pas lu ». Permettre relectures avec historique. Distinguer **format** au niveau de l'exemplaire possédé (papier/ebook/audio), ce qui sert aussi l'ownership.

### Culture du DNF (Did Not Finish)

Le DNF est devenu un **acte revendiqué**, surtout chez les jeunes lecteurs, nettement plus enclins à abandonner un livre qui ne fonctionne pas que les générations plus âgées. Près de 29 % des Américains déclarent ne jamais finir un livre commencé. Le frein principal est la **« DNF guilt »** : culpabilité de ne pas honorer le travail de l'auteur. La communauté a même créé des défis « anti-TBR » pour s'autoriser à lâcher prise.

➜ **Colophon** : faire du **DNF un statut de première classe**, neutre et non culpabilisant (pas « échec », pas relégué). Optionnel : enregistrer *à quelle page/raison* on a abandonné (utile pour soi, et pour des stats « taux de DNF par genre »). Éviter tout vocabulaire moralisateur. Un débat communautaire récurrent — « est-ce que je compte mes DNF comme lus ? » — montre qu'il faut **laisser le choix** d'inclure ou non les DNF dans les compteurs de l'objectif annuel.

---

## 2. Notation et critique (rating & reviewing)

### Le rejet croissant de l'étoile

Un mouvement net, documenté en 2024+, voit des lecteurs **refuser la notation par étoiles**, jugée :

- **réductrice** : « la texture de la réponse — l'hésitation, l'ambivalence, l'amour mêlé de frustration — ne tient pas dans une étoile » ;
- **non standardisée** : chacun a sa propre échelle, donc la moyenne ne « veut rien dire » ;
- **trompeuse** : un roman ambitieux et clivant stagne à 3★ tandis qu'un livre plaisant mais oubliable monte à 4★, ce qui détourne les lecteurs des œuvres exigeantes.

### Les demi-étoiles et au-delà

StoryGraph a fait du **rating granulaire** un argument fort : non seulement les demi-étoiles (impossibles sur Goodreads), mais des **quarts** (2,75★, 4,75★). Pour beaucoup, c'est précisément ce qui rend la note *supportable* : assez fine pour être honnête.

### Les « no-review loggers »

Une part importante de lecteurs veut **juste consigner** (date, format) **sans noter ni rédiger**. Forcer une note est un point de friction qui fait fuir ce profil.

### L'approche mood/pace de StoryGraph

Plutôt qu'une note unique, StoryGraph propose un **questionnaire qualitatif** : humeur (*reflective, tense, hopeful, emotional…*), rythme (*slow/medium/fast*), focus *personnages vs intrigue*, fiction « character-driven » ou « plot-driven ». Avantage UX majeur : ces données **alimentent les recommandations et les filtres** (« je veux un livre *tense* et *fast-paced* ce soir ») et donnent un sens à la notation sans la réduire à un chiffre. C'est devenu l'un des principaux motifs de bascule depuis Goodreads.

### Les content warnings : une demande de lecteur, pas une censure

Les avertissements de contenu (classés *graphic / moderate / minor*) sont l'une des fonctions les plus citées des switchers vers StoryGraph. Côté lecteur, c'est un **outil de confort et de sécurité**, pas une note morale : pouvoir éviter certains thèmes, ou s'y préparer. La demande est forte au point que StoryGraph en a fait un champ de préférences (filtrer/avertir automatiquement).

➜ **Colophon** :
- Rendre **toute notation et toute critique facultatives** ; ne jamais bloquer un log sur l'absence de note.
- Si notation : proposer **demi-étoiles au minimum** (idéalement granularité fine). Permettre de **désactiver complètement les étoiles** au profit d'un simple « aimé / mitigé / pas aimé » ou d'un champ libre.
- Envisager un **set d'attributs qualitatifs légers** (humeur, rythme) à la StoryGraph — différenciant, et surtout *exploitable* pour le tri/filtrage de la bibliothèque personnelle.
- **Content warnings** : champ structuré, communautaire si possible, présenté comme service au lecteur (filtre/alerte opt-in), jamais comme jugement.

---

## 3. Rangement et organisation (shelving)

### TBR (« To Be Read ») : la pile et son anxiété

La **TBR** est l'objet culturel central de la lecture en ligne. Elle est aussi une source d'**angoisse** assumée : pile « sans fond », sentiment de dette, comparaison sociale. BookTok (34 M+ de posts) alimente massivement la TBR au point de la rendre ingérable. Les lecteurs développent des stratégies de coping : objectifs réalistes (« 10 pages/jour », « 2 livres/mois »), découpage en sous-listes thématiques ou mensuelles, défis « vide ta TBR ».

➜ **Colophon** : traiter la TBR comme un espace **apaisant et actionnable**, pas un compteur culpabilisant. Idées : ne pas afficher le total brut en gros (« 247 livres à lire » = anxiogène) ; proposer des **vues filtrées/aléatoires** (« pioche-moi un livre court de ma TBR ce soir »), distinguer TBR *possédée* (déjà chez moi, donc prioritaire) de TBR *wishlist* (pas encore acheté). Cette distinction, native à un app d'ownership, résout en partie l'angoisse.

### Étagères personnalisées et tags

Goodreads popularise les **« shelves »** (étagères) qui sont en réalité des tags ; on distingue les étagères *exclusives* (un livre = une seule) des *tags* (multiples). StoryGraph mappe les shelves Goodreads en **tags**. Les recherches sur les données montrent que les lecteurs organisent leurs livres de façon **organique et non systématique** (par humeur, projet, provenance, format…), et que les plateformes exploitent mal cette richesse.

### « Currently Reading » multiple

Lire **plusieurs livres en parallèle** est la norme chez les gros lecteurs (un roman + un audio + un essai…). Les apps doivent gérer plusieurs « en cours » simultanés sans friction, idéalement avec progression par livre.

### Possédé vs Lu vs Wishlist : la distinction-clé pour un app d'ownership

Goodreads et StoryGraph confondent largement *lu*, *à lire*, *en cours* — et ignorent la **possession**. Or pour un lecteur-propriétaire, les statuts orthogonaux sont multiples :

- **Possédé** (et où : format, exemplaire, emplacement) — indépendant de…
- **Lu / en cours / DNF / à lire** (statut de lecture) — indépendant de…
- **Wishlist** (envie d'acheter, pas encore possédé).

Un même livre peut être *possédé mais pas lu*, *lu mais pas possédé* (emprunté en médiathèque), *possédé en double*, *wishlisté en édition spéciale alors qu'on possède déjà l'édition courante*.

➜ **Colophon** (cœur du produit) : **séparer nettement deux axes** — (1) *possession/exemplaire* et (2) *statut de lecture* — au lieu de les fusionner dans une seule « étagère ». C'est la principale faille des concurrents et la principale valeur ajoutée d'un app centré ownership. Permettre tags libres multiples par-dessus, et au moins une notion d'étagère/emplacement physique (« salon », « bureau », « prêté à… »).

---

## 4. Défis et gamification

### Le challenge annuel : moteur n°1 d'engagement… et de pression

Le **Goodreads Reading Challenge** (fixer un nombre de livres pour l'année + barre de progression) est l'un des ressorts de rétention les plus efficaces jamais déployés : il crée une boucle d'engagement sur 12 mois. Mais il a un **revers documenté** :

- la focalisation glisse du *plaisir de lire* vers la *complétion du compteur* ;
- le sentiment d'« échouer » au challenge plonge des lecteurs en *reading slump* (panne de lecture) ;
- l'objectif en *nombre de livres* pousse à choisir des livres courts, ce qui biaise la lecture.

### Autres formats ludiques

- **#PopSugar Reading Challenge**, **bingos de lecture**, prompts thématiques : appréciés car ils **diversifient** les lectures plutôt que de les compter (motivation qualitative > quantitative).
- **Dashboards de stats** : très valorisés par le profil « tracker » (genres, pages, formats, longueur moyenne).
- **« Year in Books » / wrap-ups** : moment social fort de fin d'année, fortement partagé (effet « Spotify Wrapped »).
- **Streaks** (jours consécutifs de lecture) : motivants pour certains, **anxiogènes** pour d'autres (un jour manqué = culpabilité, voire abandon de l'app).

➜ **Colophon** :
- Proposer le challenge annuel mais en **objectif souple et reparamétrable** (livres *ou* pages *ou* heures, modifiable sans honte), et toujours **désactivable**.
- Privilégier les **défis qualitatifs/diversifiants** (genres, formats, BD/manga, autrices, médiathèque vs achat) plutôt que la course au volume.
- Soigner le **bilan annuel** (artefact partageable, esthétique) : fort levier d'acquisition virale, faible coût émotionnel.
- **Streaks : opt-in et indulgents** (jours « gelés », rattrapage), jamais imposés. La règle d'or : *la gamification doit récompenser, jamais punir.*

---

## 5. Coutumes sociales

### Clubs de lecture et buddy reads

Le **club de lecture** reste une pratique forte (Fable : 100 000+ clubs). Le **buddy read** — lire le même livre en même temps et commenter au fil des pages — est en plein essor. StoryGraph en a fait une fonction soignée : groupes privés ≤ 15 personnes, **commentaires ancrés à une page précise**, masqués jusqu'à ce que le lecteur atteigne le passage (anti-spoiler natif). C'est un modèle UX à retenir.

### BookTok / Bookstagram / BookTube : trois cultures distinctes

La recherche académique (Reddan et al., *Social Reading Cultures*, 2024) distingue nettement :

- **Bookstagram** : esthétique, sensoriel, « shelfies », mises en scène de livres et objets ;
- **BookTube** : conversation longue, « l'ami·e cultivé·e qui te conseille » ;
- **BookTok** : émotion, « se faire emporter », recommandations virales, moteur de ventes massif.

Ces communautés ont **redistribué le pouvoir de prescription** : ce ne sont plus les éditeurs/critiques mais les lecteurs-créateurs qui font les best-sellers.

### Recommandations : amis vs algorithme

Les lecteurs accordent **plus de confiance aux recommandations d'amis/de communautés** qu'aux suggestions algorithmiques, perçues comme commerciales (reproche-clé adressé à Goodreads : « la homepage des placements publicitaires »). StoryGraph séduit en partie parce que ses recommandations s'appuient sur des données qualitatives (humeur/rythme) et non sur la promotion.

### Appétit ET fatigue du social

Double mouvement : forte appétence pour le partage **mais** fatigue réelle (comparaison, performance, surcharge de TBR, « obligation » de poster). Beaucoup adoptent StoryGraph *pour ses stats, pas pour le social*, qu'ils désactivent de fait.

➜ **Colophon** :
- Le social doit être **opt-in et granulaire** : partager une étagère, un bilan, une critique — au cas par cas, jamais par défaut.
- Si buddy reads : copier le **commentaire ancré à la page + anti-spoiler** de StoryGraph.
- Valoriser le **partage d'étagères/listes curatées entre amis** (plus authentique que l'algo) avant d'investir dans un moteur de reco automatique.
- Permettre un **mode « privé/solo » complet** : un lecteur doit pouvoir utiliser Colophon comme un journal intime sans aucune dimension sociale.

---

## 6. Coutumes spécifiques du propriétaire de livres physiques

C'est le **terrain le moins bien servi** par Goodreads/StoryGraph, et l'opportunité majeure de Colophon. Les usages réels, documentés via les apps de catalogage (CLZ Books, iCollect Books, LibraryThing, Vorby) :

- **Cataloguer sa bibliothèque** par **scan ISBN** (caméra du téléphone) : les métadonnées se remplissent en ~1 seconde. C'est *la* fonction qui rend la saisie supportable à grande échelle.
- **Éviter les doublons en librairie** : besoin n°1 cité. Le scanner doit **alerter en magasin** « tu possèdes déjà ce livre » (ou « tu l'as en wishlist », ou « tu l'as DNF »). Énorme valeur perçue.
- **Suivi des prêts** : noter à qui un livre est prêté et depuis quand (« prêté à… »), récurrent et mal géré ailleurs.
- **Éditions et exemplaires précis** : les collectionneurs veulent la *bonne édition* (couverture, ISBN, année), pas un titre générique. Notes pour **éditions spéciales, exemplaires signés, tirages limités**.
- **Esthétique « shelfie »** : la bibliothèque comme objet à montrer (lien avec Bookstagram) — l'app peut générer de belles vues d'étagères.
- **Complétion de séries** (manga, BD, sagas) : besoin très fort de **suivre les tomes manquants** d'une série (« il me manque les tomes 7 et 12 »), de visualiser la progression d'une collection. Crucial pour le marché français (cf. §8).

➜ **Colophon** (différenciation principale) :
- **Scan ISBN rapide + base de métadonnées fiable** au niveau **édition** (pas seulement œuvre).
- **Détection de doublon au scan**, exploitable *en librairie* (mode hors-ligne / rapide), avec distinction possédé / wishlist / lu / DNF.
- **Gestion des prêts** (emprunteur, date, retour).
- **Vue « série/collection »** avec tomes possédés vs manquants — argument décisif pour les lecteurs de manga/BD.
- Champs **édition spéciale / signé / dédicacé / valeur** pour les collectionneurs.
- Vues d'étagères **esthétiques et partageables** (« shelfie » numérique).

---

## 7. Points de friction : ce qui fait abandonner (ou garder) une app

### Ce qui fait abandonner

1. **Friction de saisie (logging)** : la cause n°1. Si consigner un livre/une lecture prend trop de gestes, l'utilisateur décroche. Le scan ISBN et les actions rapides sont vitaux.
2. **Mauvaise UX / app lente ou qui plante** : reproche central fait à Goodreads (« design vieillot qui plante »), motif explicite de bascule vers StoryGraph (interface épurée, mises à jour fréquentes).
3. **Pression / culpabilité** : streaks ratés, challenge « échoué », TBR anxiogène → *reading slump* puis désinstallation.
4. **Obligations imposées** (noter, rédiger, être social) qui ne correspondent pas au profil.
5. **Peur du lock-in / perte de données** : sujet de plus en plus saillant. L'export Goodreads **perd 22-38 % des métadonnées** (ISBN, dates de publication, données d'édition manquantes), imports qui plantent. Les lecteurs *savent* désormais qu'ils peuvent être prisonniers de leurs données.

### Ce qui fait garder

- **Import Goodreads propre et fidèle** : la barrière de migration est tombée *grâce* aux bons outils d'import de StoryGraph/Hardcover. C'est désormais un **prérequis d'entrée de gamme**, pas un bonus.
- **Export libre** (CSV complet, avec ISBN/dates/éditions) : rassure et, paradoxalement, fidélise (l'utilisateur reste parce qu'il *pourrait* partir).
- **Vitesse, fiabilité, design calme**.
- **Sentiment de propriété de ses données** et absence de publicité.

➜ **Colophon** :
- **Réduire le logging au strict minimum** : scan, statut en un tap, dates pré-remplies (« aujourd'hui »).
- **Import Goodreads ET StoryGraph dès le lancement**, en préservant un maximum de métadonnées (récupérer l'ISBN même quand l'export source ne le fournit pas).
- **Export CSV complet, sans rétention** : en faire un **argument de confiance affiché** (« vos données vous appartiennent, exportez-les quand vous voulez »). Anti-lock-in = positionnement marketing.
- **Performance et calme visuel** comme exigences non négociables (la leçon Goodreads → StoryGraph).

---

## 8. Spécificités du marché français

### Babelio : le réflexe francophone

**Babelio** est le réseau social de lecture de référence en France (critiques, notes, citations, défis « Masse critique », quiz, listes). C'est le **point de comparaison local** incontournable : un lecteur français évalue Colophon par rapport à Babelio autant que par rapport à Goodreads. Babelio est fort sur le social/critique et la découverte, mais **faible sur l'ownership physique** et le suivi data moderne — la même brèche que côté anglophone.

➜ **Colophon** : prévoir si possible un **import/synchronisation depuis Babelio** (ou au minimum CSV), et se positionner en *complément* (ma bibliothèque physique + mon suivi) plutôt qu'en concurrent frontal du social Babelio.

### Manga et BD : la France, 2ᵉ marché mondial du manga

Le marché français de la BD pèse **837 M€** en 2024 (+50 % vs 2019, malgré un repli de ~9 % en volume sur l'année). Le **manga représente plus d'une BD vendue sur deux** : 36 millions d'exemplaires en 2024, 309 M€ de CA, **3 083 nouveautés** publiées par 73 éditeurs. Chez les **7-19 ans**, la BD (55 %) et le manga (47 %) devancent le roman (43 %).

Conséquence UX : une part énorme du lectorat français lit en **séries longues à tomes multiples**, achète des **volumes physiques**, et a un besoin aigu de **suivi de collection** (tomes possédés/manquants, éditions, coffrets, éditions collector). C'est exactement le besoin §6 — et il est **surdimensionné en France**.

➜ **Colophon** : faire du **suivi de séries manga/BD un cas d'usage de première classe** (métadonnées par série et par tome, vue de complétion, alertes « nouveau tome sorti »). Différenciant fort sur le marché français, où Goodreads est mal adapté.

### Rentrée littéraire

Rituel éditorial unique (aout-octobre, ~450-500 nouveautés). Pic d'attention, de TBR et de prescription (Babelio, médias, prix). 

➜ **Colophon** : opportunité de **moments éditorialisés** (listes rentrée, suivi des prix littéraires, défis saisonniers) calés sur le calendrier français.

### Médiathèques

Forte culture de l'**emprunt en médiathèque** (gratuit, structurant, notamment chez les jeunes et dans le contexte de baisse du temps de lecture — les **7-19 ans** ne lisent plus que **19 min/jour**, en recul, avec un « décrochage préoccupant » signalé par le CNL/Ipsos 2024). L'emprunt crée des livres *lus mais non possédés*, souvent avec une **date de retour** à ne pas dépasser.

➜ **Colophon** : prévoir un statut **« emprunté »** (médiathèque/ami) distinct de *possédé*, avec **date de retour** optionnelle et rappel. Cela renforce la justesse du modèle ownership et parle directement au public jeune et aux usagers de médiathèques.

---

## Synthèse : 10 implications UX prioritaires pour Colophon

1. **Modularité** : social, notes, challenges, stats tous désactivables — servir les 4 profils sans en effrayer aucun.
2. **Ownership comme axe propre**, séparé du statut de lecture : possédé / lu / à lire / DNF / wishlist / emprunté sont **orthogonaux**.
3. **Scan ISBN + détection de doublon en librairie** : la killer feature du propriétaire de livres.
4. **Suivi de séries (manga/BD)** : tomes possédés vs manquants — décisif pour le marché français.
5. **Lecture = événement daté répétable** : relectures, formats multiples, plusieurs « en cours ».
6. **DNF neutre et de première classe** ; aucune mécanique culpabilisante.
7. **Notation 100 % optionnelle**, demi-étoiles a minima, alternative qualitative (mood/pace) ; content warnings au service du lecteur.
8. **Gamification douce** : objectif souple, défis qualitatifs, bilan annuel partageable, streaks indulgents et opt-in.
9. **Anti-lock-in affiché** : import Goodreads/StoryGraph/Babelio fidèle + export CSV complet = argument de confiance.
10. **Vitesse et calme visuel** non négociables ; gestion des prêts et statut « emprunté médiathèque » avec rappels.

---

## Sources

- Centre national du livre / Ipsos, *Les jeunes Français et la lecture 2024* : https://www.ipsos.com/sites/default/files/ct/news/documents/2024-04/Ipsos-CNL-jeunes-et-lecture-2024-rapport-complet.pdf
- Livres Hebdo, « En 2024, un décrochage préoccupant de la lecture chez les jeunes » : https://www.livreshebdo.fr/article/etude-cnlipsos-en-2024-un-decrochage-preoccupant-de-la-lecture-chez-les-jeunes
- IDBOOX, *Marché de la bande dessinée — chiffres clés 2024* : https://www.idboox.com/news-livres/marche-de-la-bande-dessinee-chiffres-cles-2024/
- ActuaBD, *Le recul de 9 % du marché francophone de la BD en 2024* : https://www.actuabd.com/MARCHE-DE-LA-BD-Le-recul-de-9-du-marche-francophone-de-la-BD-en-2024-doit-nous
- Journal du Japon, *Bilan de marché 2025 — le manga en France* : https://www.journaldujapon.com/2025/09/17/bilan-de-marche-2025-1-en-france-le-manga-un-livre-pas-comme-les-autres/
- Babelio, *Les 10 BD les plus populaires de 2024* : https://www.babelio.com/article/2957/Les-10-BD-les-plus-populaires-de-2024
- Your Book Friend, *How to Track Your Reading in 2026* : https://yourbookfriend.com/2025/11/26/how-to-track-your-reading-in-2026-goodreads-alternatives-and-comparisons/
- Beyond The Spine Reviews, *The Best Book Tracker in 2026* : https://beyondthespinereviews.com/2025/12/29/best-book-tracker/
- Wikipedia, *The StoryGraph* : https://en.wikipedia.org/wiki/The_StoryGraph
- The Espresso Edition, *10 Reasons Why I Switched From Goodreads To The StoryGraph* : https://theespressoedition.com/the-storygraph/
- The Nod Mag, *StoryGraph is the upgrade Goodreads forgot to get* : https://thenodmag.com/content/storygraph-reading-app-goodreads-alternative-woman-founded
- The StoryGraph roadmap, *Content warnings preferences* : https://roadmap.thestorygraph.com/features/posts/a-user-can-specify-the-types-of-content-they-want-to-avoid-in-th
- LitReactor, *Death to Stars: Why I Won't Use Stars to Rate Books Anymore* : https://litreactor.com/columns/death-to-stars-why-i-wont-use-stars-to-rate-books-anymore
- Readmt, *On the Problem With Star Ratings for Literature* : https://readmt.com/on-the-problem-with-star-ratings-for-literature/
- Book Riot, *Over 50% of Adults Have Not Finished a Book in the Last Year* : https://bookriot.com/american-reading-habits-2022/
- Modern Mrs Darcy, *How learning to DNF books enhanced my reading life* : https://modernmrsdarcy.com/dnf-books/
- Armed with A Book, *Dealing with DNF* : https://armedwithabook.com/dealing-with-dnf-the-practice-of-did-not-finish/
- The Dark Academicals Book Club, *The Goodreads challenge and the cult of completion* : https://thedarkacademicalsbookclub.substack.com/p/the-goodreads-challenge-and-the-cult
- Trophy, *Goodreads Gamification Case Study (2025)* : https://trophy.so/blog/goodreads-gamification-case-study
- Reddan, Rutherford, Schoonens & Dezuanni, *Social Reading Cultures on BookTube, Bookstagram, and BookTok* (Routledge, 2024) : https://www.taylorfrancis.com/books/mono/10.4324/9781003458616/social-reading-cultures-booktube-bookstagram-booktok-bronwyn-reddan-leonie-rutherford-amy-schoonens-michael-dezuanni
- Ooligan Press, *BookTok: 5 Readers and Reviewers / TBR* : https://www.ooliganpress.com/five-booktokers/
- iCollect Books, *Book Collection App* : https://www.icollecteverything.com/books/
- CLZ Books, *Book Collection App / Software* : https://clz.com/books/book-collection
- Vorby, *The Best App for Cataloguing Books* : https://vorby.com/blog/app-for-cataloguing-books
- Marketing Case Study, *12 Best Goodreads Alternatives in 2026* : https://marketingcasestudy.io/alternatives/goodreads/
- Alibaba LifeTips, *Alternatives to Goodreads: Low-Friction Options* : https://lifetips.alibaba.com/tech-efficiency/there-are-alternatives-to-goodreads
- Goodreads Help, *How do I create custom shelves and tags?* : https://help.goodreads.com/s/article/How-do-I-create-custom-shelves-1553870934223
- Towards Data Science, *What can we learn from how readers organize their books online?* : https://towardsdatascience.com/what-can-we-learn-from-how-readers-organize-their-books-online-9bbb43d78eee/
