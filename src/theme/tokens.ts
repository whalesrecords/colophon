/**
 * Colophon design tokens — transcribed from the high-fidelity handoff
 * (design/design_handoff_colophon_mobile). Single source of truth for colors,
 * typography, spacing, radii and shadows; consumed by the Tamagui config.
 *
 * Direction: wabi-sabi — parchemin + espresso chrome; the colour comes from the
 * book covers and the four "tranches". Brand identity: "Les tranches" — a pyramid
 * of four book slices (brique/prusse/forêt/ocre) on an espresso shelf with a §
 * medallion. Brand accent: Espresso.
 */

export const palette = {
  // Surfaces — parchemin (light) / nuit (dark). Warm canvas, lighter cards on top.
  paper: '#EFE6D3', // app background (warm parchemin)
  parchment: '#EFE6D3',
  nuit: '#221B14', // dark background
  paperCard: '#FBF6EC', // cards / document surfaces (lighter, so they pop)
  white: '#FFFFFF', // bubbles, contrasted cards
  surfaceWarm: '#F1E9D9',
  surfaceWarmAlt: '#E8DECB',

  // Hairlines (filet)
  hairline: '#EAE2D1', // primary
  hairlineLight: '#F0E9DA',
  hairlineOnPaper: '#E7DECB',
  hairlineStrong: '#DED4BF',

  // Ink — espresso
  ink: '#2A1E15', // primary text (espresso)
  inkSoft: '#3A362F', // body
  concreteDark: '#6E6A62',
  concrete: '#8C8479', // muted
  concreteLight: '#9B968C',
  concreteLighter: '#C3BCAC',
  headerConcrete: '#8C8479',
  track: '#E4DAC7', // progress rail

  // Brand: deep Espresso for ink / § / logo; a warmer espresso for the interactive
  // accent (buttons, active states) so it reads clearly as coffee-brown, not black.
  espresso: '#2A1E15', // ink, §, logo, nav chrome
  espressoDeep: '#1A120C',
  // `aizome*` kept as the accent token name (now warm Espresso) so existing refs hold.
  aizome: '#44301E', // interactive accent — warm espresso
  aizomeDeep: '#2A1E15',
  aizome08: 'rgba(68,48,30,0.08)',
  aizome10: 'rgba(68,48,30,0.10)',
  aizome16: 'rgba(68,48,30,0.16)',

  // The four tranches — one colour per shelf / collection (light · on-dark).
  brick: '#AE4133', // Romans · alertes douces
  brickDark: '#C0533C',
  prussian: '#225F77', // Essais · en cours
  prussianDark: '#2E78A6',
  forest: '#2D6B4E', // Séries · terminé
  forestDark: '#3E9460',
  gold: '#B5832E', // Mangas · BD · envies
  goldDark: '#D8B36A',

  // Legacy signal names, remapped to the tranches (kept so components don't break)
  terracotta: '#AE4133', // → rouge brique
  ochre: '#B5832E', // → ocre doré
  sage: '#2D6B4E', // → vert forêt
  scanBeam: '#C9A86F', // scanner beam glow (warm)
} as const;

/** Reading-status pill colours — mapped to the tranches. */
export const statusColors = {
  to_read: { dot: '#8C8479', chipBg: 'rgba(140,132,121,0.12)', chipText: '#6E6A62' },
  reading: { dot: '#225F77', chipBg: 'rgba(34,95,119,0.10)', chipText: '#225F77' }, // bleu de Prusse
  read: { dot: '#2D6B4E', chipBg: 'rgba(45,107,78,0.10)', chipText: '#2D6B4E' }, // vert forêt
  abandoned: { dot: '#AE4133', chipBg: 'rgba(174,65,51,0.12)', chipText: '#AE4133' }, // rouge brique
} as const;

export const fonts = {
  serif: 'Spectral', // editorial serif — titles, book titles, display numbers
  sans: 'SchibstedGrotesk', // grotesque UI — interface, labels, data
} as const;

/** Base-4 spacing scale. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

/** Corner radii. Default 2px (buttons, fields, covers). */
export const radius = {
  default: 2,
  none: 0,
  card: 16,
  bubble: 14,
  sheet: 24, // sheets rising from the bottom (top corners 22–24)
  pill: 999,
} as const;

/** Typography scale (size + line-height + tracking + recommended weight). */
export const typography = {
  display: { family: fonts.serif, size: 40, weight: '500', letterSpacing: -0.8 },
  bookTitle: { family: fonts.serif, size: 23, weight: '500' },
  sectionTitle: { family: fonts.serif, size: 18, weight: '500' },
  body: { family: fonts.sans, size: 15, weight: '400', lineHeight: 23 },
  ui: { family: fonts.sans, size: 14, weight: '500' },
  label: {
    family: fonts.sans,
    size: 11,
    weight: '600',
    letterSpacing: 2.2, // 0.20em
    textTransform: 'uppercase' as const,
    color: palette.concrete,
  },
  data: { family: fonts.sans, size: 13, weight: '500' }, // tabular-nums
} as const;

/** Elevation tokens (react-native shadow style objects). */
export const shadows = {
  card: {
    shadowColor: '#1C1A17',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  floating: {
    shadowColor: '#1C1A17',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modal: {
    shadowColor: '#1C1A17',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cover: {
    shadowColor: '#1C1A17',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
} as const;

/** Book cover aspect ratio (2:3). */
export const COVER_ASPECT_RATIO = 67 / 100;

export type ReadingStatus = keyof typeof statusColors;

// Reading status — single source of truth (data labels are FR-only).
export const STATUS_ORDER: ReadingStatus[] = ['to_read', 'reading', 'read', 'abandoned'];
export const STATUS_LABELS: Record<ReadingStatus, string> = {
  to_read: 'À lire',
  reading: 'En cours',
  read: 'Lu',
  abandoned: 'Pas fini', // neutral framing (DNF), per the dossier's anti-pressure guardrail
};

// Possession axis — orthogonal to reading status.
export type Ownership = 'owned' | 'wishlist' | 'borrowed';
export const OWNERSHIP_ORDER: Ownership[] = ['owned', 'wishlist', 'borrowed'];
export const OWNERSHIP_LABELS: Record<Ownership, string> = {
  owned: 'Possédé',
  wishlist: 'Envie',
  borrowed: 'Emprunté',
};

// Format of a copy (physical/digital).
export type BookFormat = 'paperback' | 'hardcover' | 'pocket' | 'ebook' | 'audio';
export const FORMAT_ORDER: BookFormat[] = ['paperback', 'hardcover', 'pocket', 'ebook', 'audio'];
export const FORMAT_LABELS: Record<BookFormat, string> = {
  paperback: 'Broché',
  hardcover: 'Relié',
  pocket: 'Poche',
  ebook: 'Numérique',
  audio: 'Audio',
};
