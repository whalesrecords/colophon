# Lieux de lecture en France — jeu de données pour la carte interactive

Données géolocalisées pour alimenter une carte à icônes (librairies, festivals,
cafés philo, cercles de lecture). Généré le 2026-06-28.

## Fichiers
| Fichier | Contenu | Lignes |
|---|---|---|
| `lieux_lecture_france.csv` | Tout, schéma unifié (à importer) | 5 768 |
| `lieux_lecture_france.geojson` | Points géolocalisés, prêts pour Leaflet/MapLibre | 5 728 |
| `librairies.csv` | Librairies seules | 4 827 |
| `festivals.csv` | Festivals & salons du livre | 892 |
| `cafes_philo.csv` | Cafés philo (curaté) | 18 |
| `cercles_lecture.csv` | Cercles / clubs de lecture (curaté) | 14 |
| `ateliers_ecriture.csv` | Associations / ateliers d'écriture (curaté) | 12 |
| `librairies_manga.csv` | Librairies tagguées manga/BD (déduit du nom) | 147 |
| `librairies_jeunesse.csv` | Librairies tagguées jeunesse (déduit du nom) | 14 |
| `boutiques_editeurs.csv` | Boutiques de maisons d'édition (curaté) | 5 |
| `librairies_rencontres.csv` | Librairies à rencontres d'auteurs + agenda (curaté) | 8 |

## Schéma (CSV unifié)
`id` · `type` · `name` · `description` · `address` · `postal_code` · `city` ·
`department` · `region` · `latitude` · `longitude` · `website` · `email` ·
`period` · `specialty` · `events_url` · `precision` · `source` · `source_ref` · `last_updated`

- `type` : `librairie` | `festival` | `cafe_philo` | `cercle_lecture` | `atelier_ecriture` → une icône par valeur.
- `latitude`/`longitude` : WGS84.
- `precision` : `exacte` (adresse) ou `ville` (centroïde commune).
- `period` : festivals = saison (dates exactes non fournies par la source, voir Agenda).
- `specialty` : librairies — `manga`, `jeunesse`, `editeur`, `rencontres` (plusieurs
  possibles, séparés par des virgules). `manga`/`jeunesse` sont **déduits du nom**
  de la librairie (haute précision mais partiel — une boutique jeunesse au nom
  créatif n'est pas captée). À affiner / enrichir.
- `events_url` : pour les librairies « rencontres », lien direct vers leur agenda
  de rencontres et dédicaces d'auteurs (ex. Mollat, Ombres Blanches, Kléber…).
- `source_ref` : SIREN (librairies) ou identifiant festival.

## Sources
- Librairies — base SIRENE via recherche-entreprises.api.gouv.fr, NAF 47.61Z
  (commerce de détail de livres en magasin spécialisé), établissements actifs.
  Officiel. Inclut enseignes (Cultura…) et indépendants. 6 entrées non diffusibles
  (micro-entrepreneurs) → nom/coords vides.
- Festivals — Panorama des festivals, Ministère de la Culture (data.culture.gouv.fr),
  discipline « livre ». Officiel, géolocalisé.
- Ateliers d'écriture — PAS de registre national : liste curée (réseaux Aleph,
  Élisabeth Bing, CICLOP, Labo des histoires, GFEN, Les Mots…), non exhaustive.
- Cafés philo & cercles — PAS de registre national. Liste curée (recherche web),
  courte et vérifiable, NON exhaustive. À enrichir par crowdsourcing (cf. carte
  « recommandations des lecteurs »).

## Agenda (festivals)
La source ne donne que la saison (`period`), pas les dates exactes (elles changent
chaque année). Pour « ajouter à l'agenda » :
1. Lien `website` pour la date exacte de l'édition.
2. Événement en 1 tap : générer un lien Google Agenda / un `.ics` pré-rempli avec
   le titre (`name`), le lieu (`address`,`city`) et une note (saison + lien) ;
   l'utilisateur choisit la date. Même mécanisme que les liens « ajouter au
   calendrier » déjà en place pour les rendez-vous de cercles.

Lien Google Agenda à construire côté app :
  https://calendar.google.com/calendar/render?action=TEMPLATE&text=<name>&location=<address>,<city>&details=Festival du livre — <period>. Dates: <website>

## Intégration Supabase
Voir `places.sql` (table `places` + RLS lecture publique). Import du CSV via le
Table editor (Import) ou `\copy`. Carte : requête par bounding box sur
latitude/longitude (ou colonne geography(Point) + PostGIS).
