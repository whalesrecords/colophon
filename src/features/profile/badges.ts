/**
 * Reading badges — the P1 "étoiles & badges" of the engagement roadmap. Computed
 * on the fly from the stats we already have (no backend yet), so they light up the
 * moment a milestone is crossed. A future version can persist + celebrate the moment
 * one is earned, and surface them on the widget / a public profile.
 */

export interface BadgeInput {
  total: number;
  readThisYear: number;
  pagesRead: number;
  authors: number;
  read: number; // books with status 'read'
  streak: number;
}

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  earned: boolean;
  /** 0..1 progress toward earning it. */
  progress: number;
}

const DEFS: {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  target: number;
  val: (i: BadgeInput) => number;
}[] = [
  {
    id: 'first',
    emoji: '📕',
    label: 'Première page',
    desc: 'Ton premier livre',
    target: 1,
    val: (i) => i.total,
  },
  {
    id: 'lib100',
    emoji: '🗃️',
    label: 'Bibliothèque',
    desc: '100 livres',
    target: 100,
    val: (i) => i.total,
  },
  {
    id: 'lib250',
    emoji: '🏛️',
    label: 'Grande collection',
    desc: '250 livres',
    target: 250,
    val: (i) => i.total,
  },
  {
    id: 'finish50',
    emoji: '✅',
    label: 'Finisseur',
    desc: '50 livres terminés',
    target: 50,
    val: (i) => i.read,
  },
  {
    id: 'year10',
    emoji: '📖',
    label: "Lecteur de l'année",
    desc: '10 lus cette année',
    target: 10,
    val: (i) => i.readThisYear,
  },
  {
    id: 'year25',
    emoji: '😋',
    label: 'Dévoreur',
    desc: '25 lus cette année',
    target: 25,
    val: (i) => i.readThisYear,
  },
  {
    id: 'pages10k',
    emoji: '🏃',
    label: 'Marathon',
    desc: '10 000 pages lues',
    target: 10000,
    val: (i) => i.pagesRead,
  },
  {
    id: 'authors50',
    emoji: '🧭',
    label: 'Éclectique',
    desc: '50 auteurs différents',
    target: 50,
    val: (i) => i.authors,
  },
  {
    id: 'streak3',
    emoji: '🔥',
    label: 'Sur la lancée',
    desc: '3 jours de série',
    target: 3,
    val: (i) => i.streak,
  },
  {
    id: 'streak7',
    emoji: '⚡',
    label: 'Une semaine',
    desc: '7 jours de série',
    target: 7,
    val: (i) => i.streak,
  },
  {
    id: 'streak30',
    emoji: '🏆',
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
      emoji: d.emoji,
      label: d.label,
      desc: d.desc,
      earned: v >= d.target,
      progress: d.target > 0 ? Math.min(1, v / d.target) : 0,
    };
  });
}
