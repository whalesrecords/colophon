/**
 * Tamagui configuration for Colophon, built from the design tokens in
 * ./tokens.ts. Two font families: Spectral (heading / editorial) and
 * Schibsted Grotesk (body / UI). Single light "paper" theme (aizome accent).
 *
 * Font `face` weights map to the exact @expo-google-fonts file names loaded in
 * the root layout — keep the two in sync.
 */
import { createFont, createTamagui, createTokens } from 'tamagui';

import { palette } from './tokens';

const headingFont = createFont({
  family: 'Spectral_400Regular',
  size: { 1: 11, 2: 12, 3: 13, 4: 15, 5: 18, 6: 22, 7: 25, 8: 28, 9: 33, 10: 40, true: 22 },
  lineHeight: { 1: 14, 2: 16, 3: 18, 4: 20, 5: 24, 6: 28, 7: 30, 8: 34, 9: 38, 10: 44, true: 28 },
  weight: { 4: '400', 5: '500', 6: '600' },
  letterSpacing: { 9: -0.5, 10: -0.8, true: 0 },
  face: {
    400: { normal: 'Spectral_400Regular', italic: 'Spectral_400Regular_Italic' },
    500: { normal: 'Spectral_500Medium' },
    600: { normal: 'Spectral_600SemiBold' },
  },
});

const bodyFont = createFont({
  family: 'SchibstedGrotesk_400Regular',
  size: { 1: 11, 2: 12, 3: 13, 4: 14, 5: 15, 6: 16, 7: 18, 8: 20, 9: 24, 10: 28, true: 15 },
  lineHeight: { 1: 16, 2: 17, 3: 18, 4: 20, 5: 23, 6: 24, 7: 26, 8: 28, 9: 32, 10: 36, true: 23 },
  weight: { 4: '400', 5: '500', 6: '600', 7: '700' },
  letterSpacing: { 1: 2.2, true: 0 },
  face: {
    400: { normal: 'SchibstedGrotesk_400Regular' },
    500: { normal: 'SchibstedGrotesk_500Medium' },
    600: { normal: 'SchibstedGrotesk_600SemiBold' },
    700: { normal: 'SchibstedGrotesk_700Bold' },
  },
});

const tokens = createTokens({
  color: {
    ...palette,
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'rgba(0,0,0,0)',
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    true: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    '-1': -4,
    '-2': -8,
    '-4': -16,
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    true: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    11: 44,
    12: 48,
    16: 64,
    20: 80,
  },
  radius: { 0: 0, 1: 2, true: 2, 2: 8, bubble: 14, card: 16, sheet: 24, pill: 999 },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
});

export const tamaguiConfig = createTamagui({
  fonts: { heading: headingFont, body: bodyFont },
  tokens,
  themes: {
    light: {
      background: palette.paper,
      backgroundHover: palette.surfaceWarm,
      backgroundPress: palette.surfaceWarmAlt,
      backgroundStrong: palette.paperCard,
      backgroundCard: palette.paperCard,
      color: palette.ink,
      colorSoft: palette.inkSoft,
      colorMuted: palette.concrete,
      colorFaint: palette.concreteLight,
      borderColor: palette.hairline,
      borderColorStrong: palette.hairlineStrong,
      accent: palette.aizome,
      accentDeep: palette.aizomeDeep,
      signal: palette.terracotta,
      positive: palette.sage,
      track: palette.track,
    },
    // Warm "sumi ink" dark theme — same keys, dark values flip automatically.
    dark: {
      background: '#15130E',
      backgroundHover: '#1C1A14',
      backgroundPress: '#221F17',
      backgroundStrong: '#1F1B15',
      backgroundCard: '#1F1B15',
      color: '#ECE6D8',
      colorSoft: '#CAC3B3',
      colorMuted: '#938C7D',
      colorFaint: '#6E685E',
      borderColor: '#332F26',
      borderColorStrong: '#423D31',
      accent: '#5E76A8',
      accentDeep: '#46598A',
      signal: '#CB8163',
      positive: '#93A07E',
      track: '#2A271F',
    },
  },
  shorthands: {
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    pt: 'paddingTop',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    pr: 'paddingRight',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    mt: 'marginTop',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mr: 'marginRight',
    bg: 'backgroundColor',
    br: 'borderRadius',
    w: 'width',
    h: 'height',
    f: 'flex',
    ai: 'alignItems',
    jc: 'justifyContent',
    gap: 'gap',
    pos: 'position',
    bw: 'borderWidth',
    bc: 'borderColor',
    ta: 'textAlign',
    fos: 'fontSize',
    fow: 'fontWeight',
    lh: 'lineHeight',
    col: 'color',
    ff: 'fontFamily',
    ls: 'letterSpacing',
    ox: 'overflow',
    dsp: 'display',
    o: 'opacity',
    zi: 'zIndex',
  } as const,
  defaultTheme: 'light',
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
