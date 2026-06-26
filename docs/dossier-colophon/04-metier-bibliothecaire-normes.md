# 04 — Métier bibliothécaire & normes de catalogage

Standards professionnels du catalogage et de la gestion des métadonnées, traduits en concepts **directement exploitables** dans Colophon. Chaque section relie la théorie bibliothéconomique à des **champs de données** ou des **fonctionnalités**.

---

## 1. Identifiants des livres et sources de métadonnées

### 1.1 ISBN

L'ISBN identifie une **manifestation** précise (une édition d'un éditeur), **pas une œuvre**.

**ISBN-10** (jusqu'à fin 2006) : 10 chiffres, dernier caractère possible `X` (=10). Clé de contrôle modulo 11 (poids 10→2).

**ISBN-13** (obligatoire depuis le 1ᵉʳ janvier 2007) : 13 chiffres = **EAN-13**. Préfixe `978`/`979`, puis groupe, éditeur, titre, clé. Clé modulo 10, poids alternés **1 et 3**.

**Quirks critiques à coder :**
- **Préfixe 979 = pas d'ISBN-10.** Aucun équivalent ISBN-10. Ne jamais « rétroconvertir » un 979. → *stocker l'ISBN-13 comme clé canonique ; générer l'ISBN-10 seulement si préfixe 978.* **(Déjà connu dans le repo : la BnF SRU indexe l'ISBN-10 → les 979 ne remontent rien, cascade tombe à travers — c'est attendu.)**
- **979-10** = préfixe français récent, très présent sur l'édition FR contemporaine et l'auto-édition.
- **Réimpressions / retirages** : un même ISBN d'un tirage à l'autre. L'ISBN n'identifie **pas** un tirage. → champ `printing`/`tirage` séparé.
- **Reliure ≠ ISBN** : broché, relié, poche, ebook, audio ont chacun leur ISBN → manifestations distinctes rattachées à la même œuvre.
- **Manga / volumes** : chaque tome a son ISBN ; coffrets/intégrales en ont encore un autre. → série + tomaison (§6).
- **Livres pré-ISBN** (avant ~1970) : aucun ISBN. → fiche valide sans ISBN ; **ne jamais rendre l'ISBN obligatoire**.

### 1.2 Autres identifiants

| Identifiant | Objet | Note |
|---|---|---|
| **EAN-13** | Code-barres commercial | ISBN-13 EST un EAN-13 (préfixe « Bookland » 978/979). |
| **ISSN** | Publications en série (revues) | 8 chiffres, clé modulo 11 (`X` possible). Fanzines, revues. |
| **ISMN** | Partitions imprimées | 13 chiffres, préfixe **979-0**, même clé qu'ISBN-13. |
| **OCLC** | N° notice WorldCat | Pivot de déduplication inter-bibliothèques. |
| **ARK (BnF)** | Identifiant pérenne | `ark:/12148/cb…` — stable et résolvable. |
| **IdRef / PPN** | Autorité ABES (sup. FR) | Interopère ISNI/VIAF/ORCID/Wikidata. |

### 1.3 Sources de métadonnées (API)

- **BnF / data.bnf.fr** : référence FR ; RDF/SPARQL, ARK, liens RAMEAU/IdRef ; SRU/Z39.50 → notices UNIMARC.
- **Open Library** : API gratuite par ISBN (`/isbn/{isbn}.json`), couvertures `covers.openlibrary.org`, modèle Work/Edition.
- **Google Books** : recherche par ISBN, vignettes ; quotas (429 fréquents), qualité inégale.
- **WorldCat / OCLC** : plus large couverture ; API souvent payante.
- **ISBNdb** : agrégateur commercial (prix/éditions).

*Stratégie applicative (déjà en place dans Colophon : cascade Google Books → Open Library → BnF).* Recommandation : **prioriser la BnF pour le FR**, conserver la **source de chaque champ** (`source`, `fetched_at`) pour arbitrer les conflits et rafraîchir.

---

## 2. Modèles de catalogage : FRBR / IFLA LRM (WEMI)

### 2.1 Les quatre entités

FRBR (1998) puis **IFLA LRM** (2017) structurent l'information en quatre niveaux **WEMI** :

- **Œuvre (Work)** : la création abstraite. *« Les Misérables » de Hugo.*
- **Expression** : une réalisation (traduction, version révisée, langue). *La traduction anglaise ; le texte français original.*
- **Manifestation** : la matérialisation éditoriale (une édition publiée). *Gallimard Folio 2002, ISBN xxx.* **Niveau de l'ISBN.**
- **Exemplaire (Item)** : l'objet physique unique. *VOTRE exemplaire, sa dédicace, son état, sa cote.*

### 2.2 Pourquoi c'est décisif pour une bibliothèque personnelle

- Une même **œuvre** existe en multiples **éditions** : sans niveau Œuvre, impossible de regrouper « tous mes exemplaires des Misérables ».
- Un livre **possédé** est par essence un **Exemplaire** : état, prix, annotations, dédicace, localisation lui sont propres.
- L'Expression sépare proprement **traductions** et **versions** (essentiel classiques + manga VO/VF).

### 2.3 Cartographie vers un modèle de données

```
work          (id, titre_uniforme, auteur_principal_id, langue_originale, première_publication, sujets[])
expression    (id, work_id, langue, type:[traduction|révision|abrégé], traducteur_id?)
manifestation (id, expression_id, isbn13, isbn10?, éditeur, collection_id?, date_pub, format,
               nb_pages, dimensions, couverture_url)
item          (id, manifestation_id, état, acquis_le, prix, provenance, cote, emplacement,
               dédicace?, notes_perso, tirage?, exemplaire_signé?)
```

*Compromis pragmatique* : une app perso peut **aplatir Expression dans Manifestation** au début, mais doit **impérativement garder séparés Work, Manifestation et Item**. C'est la séparation Work/Item qui crée la valeur (« mes 3 éditions de Dune »). → Voir `06` pour la cible appliquée au schéma Colophon actuel (qui aplatit aujourd'hui Work+Manifestation dans `book_metadata`).

---

## 3. Systèmes de classification

### 3.1 Dewey (CDD / DDC)

Classification **décimale**, 10 classes (000 Généralités → 900 Histoire/Géo). *843 = roman de langue française ; 741.5 = bande dessinée.* Dominante en **lecture publique** et **médiathèques françaises** (souvent simplifiée pour jeunesse/fiction).

### 3.2 Library of Congress (LCC)

Classification **alphanumérique** par lettres (P Langues/littératures, Q Sciences…). Dominante en bibliothèques universitaires anglophones.

### 3.3 La « cote » (call number) et le rangement

La **cote** = adresse physique sur l'étagère : indice de classification + **lettres d'auteur** (3 premières lettres, ou Cutter) + parfois tomaison.
*Ex. médiathèque FR* : `843 HUG` (Hugo, roman) ; fiction : `R HUG`, polar `RP HUG`. On distingue souvent **fiction** (genre + auteur) et **documentaire** (Dewey).

### 3.4 Quand l'app doit suggérer une classification

- **Auto-suggestion** depuis les sujets BnF/RAMEAU ou la Dewey récupérée via API → proposer indice + cote auteur générée. → champs `dewey`, `cote` (calculée), override manuel.
- **Utilité** : rangement physique cohérent, regroupement thématique, étiquettes de dos. Pour une bibliothèque perso, une **cote simplifiée** (genre + 3 lettres d'auteur + n° de tome) suffit et reste plus parlante que la Dewey complète. **(Colophon a déjà un champ `location` libre sur `items` — la cote viendrait l'enrichir/le structurer.)**

---

## 4. Contrôle des sujets et des autorités

### 4.1 Indexation matière

- **RAMEAU** (BnF) : vocabulaire matière FR — vedettes de noms communs et de forme/genre. Référence francophone.
- **LCSH** : équivalent anglophone.
- **Sujets topicaux vs genre/forme** : distinguer *ce dont parle le livre* (« Guerre de Sécession ») de *ce qu'il est* (« Roman historique », « Bande dessinée »). → **deux champs** : `subjects[]` (topical) et `genre_form[]`.

### 4.2 Autorités auteurs et désambiguïsation

- **VIAF** : agrège les fichiers d'autorité nationaux ; pivot international.
- **ISNI** : identifiant ISO (16 chiffres) personnes/organismes.
- **IdRef** (ABES, FR) : pérenne (PPN Sudoc), interopère ISNI/VIAF/ORCID/Wikidata, lié à l'ARK BnF.

Résolvent les cas durs : **homonymes** (deux « Jean Martin »), **pseudonymes** (Romain Gary / Émile Ajar), **auteurs de manga** (translittération, ordre nom/prénom, noms de plume). L'autorité fige une **forme retenue** (vedette) et rattache les variantes.

### 4.3 Pourquoi l'autorité > tags libres

Les tags libres produisent des doublons (`SF`, `sci-fi`, `science-fiction`), des fautes, et empêchent le regroupement fiable. Une **vedette d'autorité** = une entité unique identifiée. → modéliser `author` comme **entité** (`author_id`, `forme_retenue`, `viaf`, `isni`, `idref`, `variantes[]`), pas comme chaîne. Idem sujets. **(Colophon stocke aujourd'hui `authors text[]` — voir `06` pour la montée en entité.)**

---

## 5. Catalogage descriptif : l'essentiel

### 5.1 ISBD et RDA

**ISBD** découpe la notice en **zones** ponctuées normalisées (titre + mention de responsabilité ; édition ; publication ; description matérielle ; collection ; notes ; identifiants). **RDA** (norme actuelle, alignée IFLA LRM) privilégie des **attributs** structurés et des **relations** plutôt qu'une chaîne figée — adapté à une base de données.

### 5.2 Champs réellement nécessaires d'une notice

| Zone | Champ | Exemple |
|---|---|---|
| Titre | **Titre propre** | *L'Étranger* |
| | Sous-titre / complément | |
| | **Titre uniforme** (regroupe éditions/traductions) | *L'Étranger* (niveau Œuvre) |
| Responsabilité | **Mention de responsabilité** (rôles typés) | « Albert Camus » ; « trad. par… » ; « ill. par… » |
| Édition | Mention d'édition | « 2ᵉ éd. revue » |
| Publication | Éditeur, lieu, **date** | Gallimard, Paris, 1942 |
| Description | **Étendue** (pages/volumes) | 159 p. ; « 3 vol. » |
| | Dimensions, illustrations | 18 cm ; ill. |
| Collection | **Collection / série** + numérotation | Folio ; n° 2 |
| Langue | Langue du texte + langue originale | fre ; (orig. fre) |
| Identifiants | ISBN, EAN, autres | |
| Notes | Notes libres | « Contient un index » |

→ Le **titre propre** est obligatoire ; le reste est progressif. La mention de responsabilité reproduit la page de titre (auteur, traducteur, illustrateur, directeur) → modéliser des relations `contributions[]` avec **rôle typé** (`relator` : auteur, trad., ill., préface…).

---

## 6. Séries et œuvres en plusieurs volumes

Point névralgique pour manga, BD et toute app de possession.

- **Série** : entité reliant des œuvres/manifestations. → entité `series` (id, titre, type) ; sur la manifestation : `series_id`, `series_position`/`tomaison`.
- **Numérotation** : stocker le numéro comme **valeur triable** (entier/décimal), pas comme texte — gère 1,2…10 et les hors-séries (« 7.5 »).
- **Ordre de lecture ≠ ordre de publication** : crucial sagas/préquelles. → deux champs `publication_order` et `reading_order`.
- **Omnibus / intégrale / coffret** : une manifestation qui regroupe plusieurs tomes ; ISBN propre ; **contient** d'autres œuvres. → relation `contains[]` / `part_of`.
- **Manga** : séries longues, éditions multiples (VO, VF, deluxe/perfect). → série + tomaison + Expression (langue/édition) + Item.

**(Colophon a déjà : détection de série, fetch des volumes, ajout en masse — mais sans entité `series` persistée ni vue de complétion « tomes possédés/manquants ». C'est le chaînon manquant n°1, cf. `05`/`06`.)**

---

## 7. Qualité des métadonnées (guide pratique)

- **Déduplication** : clé = ISBN-13 normalisé ; à défaut empreinte `titre normalisé + auteur autorité + année + éditeur`. Conserver l'OCLC quand dispo.
- **Normalisation auteurs** : forme « **Nom, Prénom** » (vedette) + forme d'affichage « Prénom Nom ». Noms japonais/chinois : conserver l'ordre culturel + forme retenue. Lier à `author_id`.
- **Titres uniformes** : regrouper traductions/éditions sous un titre uniforme (gère « The Stranger » / « L'Étranger »).
- **Langues** : **ISO 639** (`fre`/`fra`, `eng`, `jpn`). Distinguer langue du document et langue originale.
- **Dates** : ISO 8601 ; tolérer dates partielles (`1942`, `[s.d.]`), incertitudes (`195?`), copyright vs impression.
- **Données manquantes** : ne jamais bloquer la saisie ; marquer `[s.l.]` (sans lieu), `[s.n.]` (sans éditeur) comme en ISBD.
- **Couvertures** : Open Library Covers, Google Books, BnF ; stocker l'URL **et** une copie locale (les API changent) ; visuel par défaut. **(Colophon gère déjà : recherche de couverture multi-sources, override par exemplaire, URL custom.)**

---

## 8. Implications condensées pour le modèle Colophon

| Concept biblio | Traduction Colophon |
|---|---|
| Œuvre / Manifestation / Exemplaire | Séparer `work` (cible) de `book_metadata` (manifestation) et `items` (exemplaire — déjà là) |
| Série + tomaison | Entité `series` + `series_position` triable ; vue de complétion |
| Autorité auteur | Entité `author` (VIAF/ISNI/IdRef) au lieu de `authors text[]` |
| Sujets vs genre/forme | `subjects[]` + `genre_form[]` (depuis RAMEAU/BnF) |
| Cote / classement | Structurer `location` ; champ `cote` auto-suggérée (Dewey simplifiée) |
| Contributions | `contributions[]` rôle typé (auteur/trad./ill.) |
| Format / reliure | Champ `format` au niveau manifestation (poche, grand format, ebook, audio) |
| Tirage | Champ `printing` au niveau exemplaire |

→ Détail et phasage dans `06-recommandations-backlog.md`.

---

## Sources

- [ISBN — Wikipedia](https://en.wikipedia.org/wiki/ISBN) · [Convert ISBN-10/13](https://www.isbnservices.com/convert-isbn-10-to-isbn-13/) · [ISBN13 check digit](https://rosettacode.org/wiki/ISBN13_check_digit)
- [ISMN — Wikipedia](https://en.wikipedia.org/wiki/International_Standard_Music_Number) · [Structure ISMN — LoC](https://www.loc.gov/ismn/structure.html)
- [IFLA LRM — Wikipedia](https://en.wikipedia.org/wiki/IFLA_Library_Reference_Model) · [LRM — Librarianship Studies](https://www.librarianshipstudies.com/2020/04/ifla-library-reference-model-lrm.html) · [WEMI (PDF)](https://railslibraries.org/sites/default/files/ce/101250/101250-537018102.pdf)
- [Données d'autorité — BnF](https://www.bnf.fr/fr/donnees-autorite-bnf) · [IdRef — ABES](https://abes.fr/reseaux-idref-orcid/outils-et-services-autorites/plateforme-idref/) · [idref.fr](https://www.idref.fr/)
- [ISMN — Transition bibliographique](https://www.transition-bibliographique.fr/B013_eng)
