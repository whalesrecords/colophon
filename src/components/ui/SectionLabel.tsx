import { Text } from 'tamagui';

/**
 * Eyebrow / section label — the unified component from the UI refonte handoff.
 * Schibsted 11px / 700 / 0.16em / UPPERCASE. Key change vs. before: it's drawn in
 * INK (`$color`), not muted grey, so it's legible on parchment. Pass `muted` for
 * the rare case where a softer label is wanted.
 */
export function SectionLabel({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.8}
      textTransform="uppercase"
      color={muted ? '$colorMuted' : '$color'}
    >
      {children}
    </Text>
  );
}
