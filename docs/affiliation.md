# Affiliation & achat du livre — dossier de mise en œuvre (Colophon)

> But : depuis la fiche d'un livre, proposer au lecteur **où l'acheter** — chez un
> libraire indépendant près de chez lui **et** chez les grands marchands (Amazon,
> Fnac, etc.) — en monétisant ces clics via des liens d'affiliation.
>
> Décision produit (28/06/2026) : **tous les marchands sont présentés à égalité**,
> l'utilisateur choisit. La couche est conçue **désactivable / configurable**
> (cf. roadmap P2/P3 « surfaces désactivables »). À titre indicatif les taux et
> règles ci-dessous doivent être **revérifiés sur les barèmes officiels** au moment
> de l'inscription : ils changent souvent (Amazon a modifié ses taux en juin 2025
> et de nouveau en janvier 2026).

---

## 1. Ce qu'on a déjà dans l'app

- `bookshopUrl` (helper) + le lien **« Trouver chez un libraire »** dans le détail
  d'un livre, qui pointe aujourd'hui vers **leslibraires.fr** par recherche
  ISBN/titre. C'est la brique de base : il suffit de la généraliser en un petit
  **registre de marchands** et d'y ajouter une **clé d'affiliation** par marchand.
- Le projet a déjà une position « jamais Amazon » historique. Elle est ici
  **assouplie sur décision explicite** : Amazon est inclus, mais l'archi permet de
  le retirer/masquer par configuration sans toucher au reste.

---

## 2. Cadre légal & règles plateformes (à respecter avant de coder)

**Prix unique du livre (loi Lang).** Le prix d'un livre neuf est fixé par
l'éditeur ; un marchand ne peut accorder que **−5 %** max. L'affiliation **ne
change pas** le prix affiché au lecteur (c'est le marchand qui te reverse une
commission sur sa marge) → **conforme**, aucun impact pour l'utilisateur.

**Transparence (DGCCRF + CGU des programmes).** Tout lien rémunéré doit être
signalé. Concrètement :
- Une **mention visible** type « Liens partenaires — Colophon peut percevoir une
  commission, sans surcoût pour vous. » près des boutons d'achat.
- Amazon impose en plus sa **formule exacte** : « En tant que Partenaire Amazon, je
  réalise un bénéfice sur les achats remplissant les conditions requises. »

**RGPD / ePrivacy.** Les liens d'affiliation déposent en général leur cookie **sur
le site du marchand** (pas chez toi) au moment du clic — pas de bandeau requis pour
ça. En revanche si tu ajoutes un **tracking de clics** côté Colophon (analytics),
il faut le consentement habituel. Garde la mention d'affiliation dans la **politique
de confidentialité**.

**App Store / Apple (important).** Les livres **papier** sont des **biens
physiques** : Apple autorise explicitement un lien vers un site externe pour les
acheter, **sans achat in-app et sans commission Apple** (≠ contenu numérique, qui
lui tombe sous l'IAP). À cadrer :
- Pour un **livre numérique / ebook** vendu via un lien externe → zone grise
  « reader app » / anti-steering : **par prudence, ne mets des liens d'achat que
  pour le papier** dans la version iOS, ou vérifie les *App Review Guidelines 3.1.1 /
  3.1.3* à jour avant soumission.
- Le lien doit **ouvrir le navigateur** (pas une webview d'achat déguisée).

**Statut & fiscalité.** Les commissions sont un **revenu** : il te faut un cadre
(auto-entrepreneur / société). Voir les papiers en §6.

---

## 3. Comparatif des programmes

| Marchand | Plateforme d'inscription | Rémunération (à revérifier) | Structure du lien | Pour qui |
|---|---|---|---|---|
| **Leslibraires.fr** (coop. libraires indé) | Direct (compte affilié) | **3 %** | `https://www.leslibraires.fr/livre/{EAN13}/?affiliate={ID}` + **API panier** | Indé, déjà intégré |
| **Place des Libraires** (Tite Live) | — (pas de programme d'affiliation public connu) | n/a (réservation, pas de commission) | page livre `/livre/{EAN13}-slug/` | Indé / « stock près de chez moi » |
| **Amazon Partenaires** | partenaires.amazon.fr | **~5 %** catégorie *Culture & média (livres)* — était 7 %, **−2 pts** depuis juin 2025, fenêtre cookie **24 h** | `https://www.amazon.fr/dp/{ISBN10}?tag={ID}` | Grand public |
| **Fnac** | via **Awin** (réseau) | **jusqu'à 10 %** (livres généralement plus bas — voir fiche) | lien tracké généré par Awin (deeplink vers la fiche Fnac) | Grand public |
| **Decitre / Cultura / Rakuten-Kobo / Eyrolles** | Awin / Kwanko / Effiliation selon l'enseigne | variable | deeplink réseau | Optionnel |
| **Bookshop.org** | bookshop.org (affiliate) | ~10 % (modèle pro-indé) | lien `/a/{ID}/...` | Présent en FR mais offre/ catalogue limités — optionnel |
| **momox / Recyclivre** | Awin / direct | variable | deeplink | Occasion (option « seconde main ») |

Notes :
- **Amazon** travaille avec l'**ISBN-10** dans l'URL `/dp/` ; tu as déjà la
  conversion ISBN-13 → ISBN-10 (`isbn.ts`, cf. la note BnF). Pour les EAN en
  **979-** (pas d'ISBN-10), utilise une URL de recherche `/s?k={isbn13}&tag={ID}`.
- **Fnac & enseignes via Awin** : tu t'inscris **une fois** sur Awin, puis tu
  demandes l'adhésion à chaque programme (Fnac, Decitre…) ; un même compte sert
  pour plusieurs marchands.
- **Place des Libraires** = le meilleur outil « **dispo en rayon près de chez
  moi** » (≈ 900–1000 librairies, recherche par ISBN), mais **sans affiliation** :
  on l'utilise pour le **service** (envoyer le lecteur réserver chez son libraire),
  pas pour le revenu.

---

## 4. Comment s'affilier — pas à pas

### 4.1 Leslibraires.fr (le plus simple, déjà aligné avec ton produit)
1. Va sur **leslibraires.fr/programme-affiliation/** et crée un compte affilié.
2. Tu reçois une **clé d'affiliation** (IDENTIFIANT).
3. Liens : `http(s)://www.leslibraires.fr/livre/{EAN13}/?affiliate={ID}`.
4. Pour aller plus loin (panier multi-articles) : **doc.leslibraires.fr** documente
   une **API panier** (`item.x.ean13`, `item.x.quantity`, `affiliate_id`) — utile
   pour un futur « acheter toute la série ».
5. Commission **3 %**, reversée selon leurs conditions.

### 4.2 Amazon Partenaires (Club Partenaires Amazon)
1. **partenaires.amazon.fr** → « S'inscrire » avec ton compte Amazon.
2. Renseigne **le site/l'app** que tu vas promouvoir (URL de la PWA Colophon +
   description du trafic), tes **infos fiscales** et ton **RIB**.
3. Tu obtiens un **tag de suivi** (`tag=monid-21`).
4. Liens : `https://www.amazon.fr/dp/{ISBN10}?tag={ID}` (ou `/s?k={ISBN13}&tag={ID}`).
5. **Période d'essai** : Amazon exige **3 ventes** dans les **180 jours** suivant
   l'inscription, sinon le compte est fermé (on peut se réinscrire).
6. Cookie **24 h**, paiement ~**60 j** après la fin du mois, seuil **25 €** (virement).
7. Affiche la **mention obligatoire** (cf. §2).

### 4.3 Fnac (et Decitre, Cultura…) via Awin
1. Crée un compte éditeur sur **Awin** (`ui.awin.com`). Une **autorisation de 5 €**
   est prélevée pour vérifier ton RIB, **puis recréditée**.
2. Cherche le programme **« Fnac FR »** (et les autres enseignes voulues) et
   **demande l'adhésion** ; validation par l'annonceur.
3. Une fois validé : accès aux **bannières, générateur de liens, flux catalogue**.
   Génère un **deeplink** vers la fiche produit Fnac correspondant à l'ISBN.
4. Contact réseau Fnac/Awin indiqué publiquement : *adrien.sansonetti@awin.com*.

> **Alternative** : certaines enseignes passent par **Kwanko** ou **Effiliation**
> (réseaux FR). Même logique : 1 compte réseau → N programmes.

---

## 5. Trouver les libraires indépendants « à côté de chez soi »

Deux briques complémentaires : **(a)** un lien d'achat indé par défaut, **(b)** une
**carte / liste géolocalisée** des librairies, idéalement filtrée sur la **dispo en
rayon**.

**Sources de données**

1. **Place des Libraires** — recherche par **ISBN** → librairies qui ont le titre
   **en stock** près d'un point. Pas d'API publique documentée : usage **deep-link**
   vers la fiche `/livre/{EAN13}-slug/` (le lecteur réserve chez son libraire).
   *Le meilleur signal « dispo près de chez moi ».*
2. **Leslibraires.fr** — couvre le **réseau de librairies indé** ; lien d'achat
   **affilié** (§4.1) + API panier.
3. **librairiesindependantes.com** — fédère 16 portails régionaux (>1200 libs) ;
   utile pour des **liens régionaux**.
4. **Géoloc des librairies (open data)** pour afficher **ta propre carte** :
   - **data.gouv.fr** — jeux « Localisation des librairies en France », « Librairies
     en Île-de-France » (avec labels **LiR/LR**), et la **base SIRENE géolocalisée**
     (filtrer le code APE **47.61Z — commerce de détail de livres**).
   - **OpenStreetMap** — `shop=books` via l'API **Overpass** (couverture inégale
     mais gratuite et mondiale).
   - **API Adresse (BAN, api.gouv.fr)** — géocodage des adresses + autocomplétion,
     pour transformer « ma ville » en coordonnées et trier les librairies par
     distance.
5. **trouvetalibrairie.fr** / **« Trouve ta librairie »** — annuaire/carte des indé,
   bon repère éditorial (pas d'API mise en avant).

**Recette recommandée dans Colophon**

- Détail du livre → bouton **« Où l'acheter »** ouvrant une *sheet* à 2 sections :
  1. **Chez un libraire** : (i) **Place des Libraires** par ISBN (« voir qui l'a en
     rayon près de chez moi »), (ii) **Leslibraires.fr** (affilié) en achat en ligne.
  2. **En ligne** : Amazon, Fnac, etc. (liens affiliés), libellés neutres.
- Onglet/écran **« Librairies »** (optionnel, plus tard) : carte des indé autour de
  la position (permission géoloc) à partir de **SIRENE 47.61Z** ou **Overpass**,
  géocodage **BAN**, tri par distance. Aligné avec la fibre « soutien à la librairie
  indépendante » du projet.

---

## 6. Les papiers / infos à préparer (checklist d'inscription)

Pour t'inscrire aux programmes, prépare :

- [ ] **Statut** : auto-entrepreneur (micro-BIC, activité « apporteur d'affaires /
      affiliation ») **ou** société. Numéro **SIRET** une fois créé.
- [ ] **IBAN/RIB** au nom du titulaire du compte affilié.
- [ ] **Identité fiscale** : pays de résidence fiscale, n° fiscal ; certains réseaux
      demandent une **attestation de TVA** ou la mention « non assujetti ».
- [ ] **URL du service** : la **PWA / site Colophon** (les programmes veulent une
      vitrine en ligne fonctionnelle, pas seulement une app native) + une courte
      **description de l'audience/trafic**.
- [ ] **Mentions légales + politique de confidentialité** publiées sur le site,
      incluant la **mention d'affiliation**.
- [ ] **Email pro** (déjà : hello@whalesrecords.com) et, pour Awin, la carte servant
      à l'**autorisation 5 €**.
- [ ] **Coordonnées de l'éditeur du service** (toi / la structure).

> Astuce ordre de passage : **Leslibraires.fr** (immédiat, sans friction) →
> **Awin/Fnac** (1 compte, plusieurs enseignes) → **Amazon** (penser à la règle des
> 3 ventes / 180 j, donc à activer quand l'app a déjà du trafic).

---

## 7. Intégration technique dans Colophon (proposition)

Généraliser l'actuel `bookshopUrl` en un **module marchands configurable**.

**Config (env)** — ✅ déjà branché dans `src/lib/env.ts` + `src/lib/bookshop.ts` :
```
EXPO_PUBLIC_AMAZON_TAG=tonid-21              # ✅ wired → amazonUrl() ajoute ?tag= + /dp/<ISBN>
EXPO_PUBLIC_LESLIBRAIRES_PARTNER=ton_id      # ✅ wired → bookshopUrl() ajoute ?affiliate=
# à venir :
# EXPO_PUBLIC_AFF_AWIN=publisher_id          # Fnac & co via deeplink Awin
```
Vide par défaut ⇒ liens normaux, rien ne casse. Renseigner ensuite dans **Vercel**
(`vercel.json` → `build.env`) pour le web et **`eas.json`** (profil production → `env`)
pour le natif, puis redéployer / rebuild.
Un registre déclaratif (un objet/table) par marchand : `id`, `label`, `enabled`,
`region`, `buildUrl(isbn13, isbn10?)`, `kind: 'indie' | 'retail' | 'secondhand'`.

**Helper** `buildPurchaseLinks(book): PurchaseLink[]`
- convertit l'ISBN-13 → ISBN-10 si besoin (réutilise `isbn.ts`),
- saute les marchands `enabled:false` ou hors `region`,
- renvoie la liste ordonnée (indé d'abord *à l'affichage* si tu veux, même si tous
  sont « à égalité » fonctionnellement),
- gère le **fallback recherche** quand pas d'ISBN-10 (979-) ou pas de fiche.

**UI**
- *Sheet* « Où l'acheter » dans `BookDetail`, avec la **mention d'affiliation** et,
  pour Amazon, sa formule imposée.
- Liens ouverts via `Linking.openURL` (navigateur), jamais une webview d'achat.
- **Flag de modularité** : `purchaseLinksEnabled` (réglage Profil/Paramètres) pour
  respecter la roadmap « surfaces désactivables » et faciliter la revue App Store.

**Mesure (optionnel, plus tard)**
- Un compteur de clics par marchand (event analytics) **derrière consentement** pour
  savoir quel canal convertit — utile pour arbitrer indé vs retail.

**Conformité à cocher avant prod**
- [ ] Mentions d'affiliation (générale + formule Amazon) affichées.
- [ ] Politique de confidentialité mise à jour.
- [ ] iOS : liens d'achat limités au **papier** (ou guidelines 3.1.x revérifiées).
- [ ] Possibilité de **désactiver** la couche par configuration.

---

## 8. Récapitulatif — quoi faire dans l'ordre

1. **Inscription Leslibraires.fr** → récupérer la clé, brancher l'affiliation sur le
   lien déjà existant.
2. **Compte Awin** → adhésion **Fnac** (+ Decitre/Cultura si voulu).
3. **Amazon Partenaires** → quand il y a du trafic (règle 3 ventes/180 j).
4. Coder le **module marchands** + la *sheet* « Où l'acheter » (indé + retail).
5. (Plus tard) écran **« Librairies »** géolocalisé via SIRENE 47.61Z / Overpass +
   BAN.
6. Publier **mentions légales / confidentialité** et activer la couche.

---

### Sources
- [Amazon Partenaires — barème / Operating Agreement](https://partenaires.amazon.fr/help/operating/schedule) · [Changement de rémunération juin 2025](https://pxagency.fr/amazon-partenaires-nouvelles-remunerations/) · [Modif. janvier 2026](https://jstm.org/amazon-commissions-affiliation/)
- [Fnac — Espace affiliation](https://www.fnac.com/affiliates/accueil.aspx) · [Programme Fnac sur Awin](https://ui.awin.com/merchant-profile/12665)
- [Leslibraires.fr — Programme d'affiliation](https://www.leslibraires.fr/programme-affiliation/) · [API / doc développeur](https://doc.leslibraires.fr/) · [API panier](https://doc.leslibraires.fr/cart_api.html)
- [Place des Libraires](https://www.placedeslibraires.fr/) · [Trouve ta librairie](https://trouvetalibrairie.fr/) · [librairiesindependantes.com](https://www.librairiesindependantes.com/)
- [data.gouv.fr — Localisation des librairies (2018)](https://www.data.gouv.fr/reuses/localisation-des-librairies-en-france-en-2018) · [Librairies en Île-de-France (labels LiR/LR)](https://www.data.gouv.fr/datasets/librairies-en-ile-de-france-idf) · [SIRENE géolocalisée](https://www.data.gouv.fr/datasets/geolocalisation-des-etablissements-du-repertoire-sirene-pour-les-etudes-statistiques) · [API Adresse (BAN)](https://api.gouv.fr/les-api/base-adresse-nationale)
- [Bookshop.org — France](https://bookshop.org/lists/france-842d5c1d-1a47-4b0c-a589-0cf97008a267)
