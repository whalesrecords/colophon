/**
 * Reading badges — the P1 "étoiles & badges" of the engagement roadmap. Computed
 * on the fly from the stats we already have (no backend yet), so they light up the
 * moment a milestone is crossed. A future version can persist + celebrate the moment
 * one is earned, and surface them on the widget / a public profile.
 */

import type { PackGlyph } from '@/components/icons';

export interface BadgeInput {
  total: number;
  readThisYear: number;
  pagesRead: number;
  authors: number;
  read: number; // books with status 'read'
  streak: number;
  reviews: number; // books with a written note ("avis")
}

export interface Badge {
  id: string;
  icon: PackGlyph;
  label: string;
  desc: string;
  earned: boolean;
  /** 0..1 progress toward earning it. */
  progress: number;
}

const DEFS: {
  id: string;
  icon: PackGlyph;
  label: string;
  desc: string;
  target: number;
  val: (i: BadgeInput) => number;
}[] = [
  {
    id: 'first',
    icon: 'book',
    label: 'Première page',
    desc: 'Ton premier livre',
    target: 1,
    val: (i) => i.total,
  },
  {
    id: 'lib100',
    icon: 'books',
    label: 'Bibliothèque',
    desc: '100 livres',
    target: 100,
    val: (i) => i.total,
  },
  {
    id: 'lib250',
    icon: 'box',
    label: 'Grande collection',
    desc: '250 livres',
    target: 250,
    val: (i) => i.total,
  },
  {
    id: 'finish50',
    icon: 'medal',
    label: 'Finisseur',
    desc: '50 livres terminés',
    target: 50,
    val: (i) => i.read,
  },
  {
    id: 'year10',
    icon: 'openBook',
    label: "Lecteur de l'année",
    desc: '10 lus cette année',
    target: 10,
    val: (i) => i.readThisYear,
  },
  {
    id: 'year25',
    icon: 'star',
    label: 'Dévoreur',
    desc: '25 lus cette année',
    target: 25,
    val: (i) => i.readThisYear,
  },
  {
    id: 'pages10k',
    icon: 'award',
    label: 'Marathon',
    desc: '10 000 pages lues',
    target: 10000,
    val: (i) => i.pagesRead,
  },
  {
    id: 'authors50',
    icon: 'map',
    label: 'Éclectique',
    desc: '50 auteurs différents',
    target: 50,
    val: (i) => i.authors,
  },
  {
    id: 'reviews10',
    icon: 'star',
    label: 'Critique',
    desc: '10 avis écrits',
    target: 10,
    val: (i) => i.reviews,
  },
  {
    id: 'reviews25',
    icon: 'award',
    label: 'Chroniqueur',
    desc: '25 avis écrits',
    target: 25,
    val: (i) => i.reviews,
  },
  {
    id: 'streak3',
    icon: 'flame',
    label: 'Sur la lancée',
    desc: '3 jours de série',
    target: 3,
    val: (i) => i.streak,
  },
  {
    id: 'streak7',
    icon: 'calendar',
    label: 'Une semaine',
    desc: '7 jours de série',
    target: 7,
    val: (i) => i.streak,
  },
  {
    id: 'streak30',
    icon: 'trophy',
    label: 'Inarrêtable',
    desc: '30 jours de série',
    target: 30,
    val: (i) => i.streak,
  },
];

export function computeBadges(input: BadgeInput): Badge[] {
  return DEFS.map((d) => {
    const v = d.val(input);
    return {
      id: d.id,
      icon: d.icon,
      label: d.label,
      desc: d.desc,
      earned: v >= d.target,
      progress: d.target > 0 ? Math.min(1, v / d.target) : 0,
    };
  });
}
