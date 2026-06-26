/**
 * Colophon design tokens — transcribed from the high-fidelity handoff
 * (design/design_handoff_colophon_mobile). Single source of truth for colors,
 * typography, spacing, radii and shadows; consumed by the Tamagui config.
 *
 * Direction: wabi-sabi / Japanese-Mediterranean — warm paper, ink, polished
 * concrete, light wood. The interface recedes so book covers are the heroes.
 * Default accent: indigo aizome.
 */

export const palette = {
  // Surfaces & paper
  paper: '#F4F1EA', // app background
  paperCard: '#FBFAF6', // cards / document surfaces
  white: '#FFFFFF', // bubbles, contrasted cards
  surfaceWarm: '#F7F4EC',
  surfaceWarmAlt: '#EDE7DA',

  // Hairlines
  hairline: '#E4DFD4', // primary
  hairlineLight: '#EFEADF',
  hairlineOnPaper: '#E7E0D2',
  hairlineStrong: '#DDD6C8',

  // Ink & polished concrete
  ink: '#1C1A17', // primary text
  inkSoft: '#3A362F', // body
  concreteDark: '#6E6A62',
  concrete: '#9B968C', // muted
  concreteLight: '#B3AC9F',
  concreteLighter: '#C3BCAC',
  headerConcrete: '#8B8779', // Profile / Discussions headers (white text on top)
  track: '#E0DACD', // progress rail

  // Accent — aizome (default)
  aizome: '#2B3A55',
  aizomeDeep: '#1F2A40',
  aizome08: 'rgba(43,58,85,0.08)',
  aizome10: 'rgba(43,58,85,0.10)',
  aizome16: 'rgba(43,58,85,0.16)',

  // Accent alt — Klein (documented for comparison; not used by default)
  klein: '#2A3BFF',

  // Signal (rare — statuses / alerts)
  terracotta: '#B65D3C',
  ochre: '#B0853A', // lending / on-loan accent
  sage: '#7E8A6F', // trend up / positive
  scanBeam: '#6E86C8', // scanner beam glow
} as const;

/** Reading-status pill colors (dot + chip background + chip text). */
export const statusColors = {
  to_read: { dot: '#6E6A62', chipBg: 'rgba(110,106,98,0.10)', chipText: '#6E6A62' },
  reading: { dot: '#2B3A55', chipBg: 'rgba(43,58,85,0.10)', chipText: '#2B3A55' },
  read: { dot: '#1C1A17', chipBg: 'rgba(28,26,23,0.08)', chipText: '#1C1A17' },
  abandoned: { dot: '#B65D3C', chipBg: 'rgba(182,93,60,0.12)', chipText: '#B65D3C' },
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
  abandoned: 'Abandonné',
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
