import { useWindowDimensions } from 'react-native';

/**
 * Adaptive layout breakpoints (Material 3 window size classes, in dp/px).
 * Compact = phone portrait · Medium = large phone / small tablet portrait ·
 * Expanded = tablet landscape / desktop · Large/XL = wide desktop.
 * @see docs guide-ux-ui — "Standards des plateformes / layouts adaptatifs"
 */
export const BREAKPOINTS = {
  medium: 600,
  expanded: 840,
  large: 1200,
  xlarge: 1600,
} as const;

/** Max readable content width for centered columns on wide screens. */
export const CONTENT_MAX = 1200;

export type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'xlarge';

export interface Breakpoint {
  width: number;
  height: number;
  sizeClass: WindowSizeClass;
  /** ≥ 600 — tablet portrait and up. */
  isTablet: boolean;
  /** ≥ 840 — tablet landscape / desktop: enable master-detail, side rail, etc. */
  isExpanded: boolean;
  /** ≥ 1200 — center content within CONTENT_MAX. */
  isWide: boolean;
  /** Content width to use for centered layouts (capped at CONTENT_MAX). */
  contentMax: number;
}

/** Reactive adaptive-layout info. Use to switch phone ↔ tablet layouts. */
export function useBreakpoint(): Breakpoint {
  const { width, height } = useWindowDimensions();
  const sizeClass: WindowSizeClass =
    width >= BREAKPOINTS.xlarge
      ? 'xlarge'
      : width >= BREAKPOINTS.large
        ? 'large'
        : width >= BREAKPOINTS.expanded
          ? 'expanded'
          : width >= BREAKPOINTS.medium
            ? 'medium'
            : 'compact';
  return {
    width,
    height,
    sizeClass,
    isTablet: width >= BREAKPOINTS.medium,
    isExpanded: width >= BREAKPOINTS.expanded,
    isWide: width >= BREAKPOINTS.large,
    contentMax: Math.min(width, CONTENT_MAX),
  };
}
