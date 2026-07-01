import { Text, XStack, YStack } from 'tamagui';

/**
 * KPITile — the single, unified stat tile from the refonte handoff. ONE definition
 * used identically on Accueil (mini-stats), Tendances (Lecteurs/Livres/Genres) and
 * Profil (Livres/Lus/Pages). Cream card, radius 16, padding 18, number Spectral 600
 * 40px (ink, or a tranche `accent`), label 12px muted. In a row, use `KPIRow`.
 */
export function KPITile({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  // Step the number down for long values (e.g. "120 €", "2 480 €") so it never
  // truncates — adjustsFontSizeToFit is a no-op on react-native-web, and these tiles
  // sit in 2- and 3-column rows, so the narrower 3-col width must fit too.
  const len = value.length;
  const size = len <= 3 ? 40 : len <= 4 ? 34 : len <= 6 ? 26 : 22;
  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={16}
      padding={18}
    >
      <Text
        fontFamily="$heading"
        fontSize={size}
        lineHeight={Math.round(size * 1.32)}
        fontWeight="600"
        color={accent ?? '$color'}
        fontVariant={['tabular-nums']}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" marginTop={8} numberOfLines={2}>
        {label}
      </Text>
    </YStack>
  );
}

/** A row of KPITiles. Canonical 12px gap; pass `gap` for more breathing room. */
export function KPIRow({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return <XStack gap={gap}>{children}</XStack>;
}
