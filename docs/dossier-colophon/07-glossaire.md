# 07 — Glossaire du vocabulaire bibliothéconomique (FR)

Termes professionnels réutilisables dans l'UI, les libellés et la doc interne de Colophon. Privilégier les mots justes : ils crédibilisent l'app auprès des lecteurs sérieux et des bibliothécaires.

| Terme | Définition | Usage possible dans Colophon |
|---|---|---|
| **Notice** | Fiche descriptive complète d'un document dans le catalogue (record). | La « fiche livre » détaillée. |
| **Exemplaire** | Objet physique unique possédé (= *Item* du modèle WEMI). | La table `items` — votre copie. |
| **Manifestation** | Une édition publiée précise (niveau de l'ISBN). | `book_metadata`. |
| **Œuvre** | La création intellectuelle abstraite, indépendante de ses éditions. | Niveau `work` (cible) regroupant les éditions. |
| **Expression** | Une réalisation d'une œuvre (traduction, version, langue). | Distinguer VO/VF d'un manga ou d'un roman. |
| **Cote** | Adresse de rangement d'un exemplaire sur l'étagère (call number). | Structurer/compléter `items.location`. |
| **Cotation** | Action d'attribuer une cote. | — |
| **Tomaison** | Numérotation des volumes d'une série/œuvre. | `series_position`. |
| **Collection** (édition) | Série éditoriale d'un éditeur (ex. « Folio », « Pléiade »). | À distinguer du « fonds » et des « étagères ». |
| **Fonds** | Ensemble cohérent de documents d'une collection/bibliothèque. | « Ma bibliothèque » / un sous-ensemble thématique. |
| **Autorité** | Référentiel normalisé d'une entité (auteur, sujet) avec forme retenue + variantes. | Entités `authors`/`subjects` (cible P3). |
| **Vedette** | Forme retenue, normalisée, d'un nom d'auteur ou d'un sujet (heading). | Forme d'affichage canonique d'un auteur. |
| **Vedette matière** | Sujet normalisé (ex. issu de RAMEAU). | Champ `subjects[]`. |
| **Indexation** | Attribution de sujets/mots-matière à un document. | Tags structurés vs tags libres. |
| **Mention de responsabilité** | Noms et rôles des responsables (auteur, traducteur, illustrateur, directeur…). | `contributions[]` à rôle typé. |
| **Titre propre** | Le titre tel qu'il figure sur la page de titre. | `title`. |
| **Titre uniforme** | Titre normalisé regroupant éditions et traductions. | Au niveau `work`. |
| **Désherbage** | Retrait raisonné de documents d'un fonds (weeding). | Fonction « archiver / retirer de la collection ». |
| **Récolement** | Inventaire de vérification de la présence physique des exemplaires. | Mode « inventaire » (scanner pour pointer la collection). |
| **Dépouillement** | Description analytique du contenu (tomes d'un ensemble, articles d'un recueil). | Contenu d'une intégrale/omnibus. |
| **OPAC** | Catalogue public en ligne consultable par l'usager. | L'équivalent = la biblio publique partagée `/s/[token]`. |
| **Notice d'autorité** | Notice décrivant une entité de référentiel (auteur, sujet, lieu). | Fiche auteur enrichie (cible). |
| **RAMEAU** | Vocabulaire matière de la BnF (sujets FR). | Source des `subjects[]`. |
| **Dewey (CDD)** | Classification décimale (000→900). | Auto-suggestion de cote/rayon. |
| **ISBD / RDA** | Normes de description bibliographique / de catalogage. | Référentiel pour le choix des champs de la notice. |
| **WEMI** | Œuvre–Expression–Manifestation–Exemplaire (FRBR / IFLA LRM). | Ossature du modèle de données cible. |
| **PPN / ARK / OCLC / VIAF / ISNI / IdRef** | Identifiants de notices et d'autorités (Sudoc / BnF / WorldCat / international). | Identifiants externes pour enrichissement et déduplication. |
| **[s.l.] / [s.n.] / [s.d.]** | « sans lieu / sans nom (éditeur) / sans date » (mentions ISBD pour données manquantes). | Affichage propre quand une métadonnée manque. |
