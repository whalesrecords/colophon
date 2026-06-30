import { useRouter } from 'expo-router';
import { Text, useTheme, XStack } from 'tamagui';

import { Icon } from '@/components/icons';

/**
 * BackLink — the one canonical "‹ Retour" affordance. Replaces the per-screen
 * Text/Pressable hacks: a real 44px touch target, accessibilityRole=button + label,
 * a crisp chevron (not the '‹' glyph), and a safe fallback when there's no history.
 */
export function BackLink({
  label = 'Retour',
  fallback = '/',
}: {
  label?: string;
  fallback?: string;
}) {
  const router = useRouter();
  const theme = useTheme();
  const accent = (theme.accent?.val as string) ?? '#2A1E15';

  const onPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };

  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap={2}
      minHeight={44}
      paddingVertical="$2"
      paddingRight="$3"
      alignSelf="flex-start"
      cursor="pointer"
      pressStyle={{ opacity: 0.6 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name="chevronLeft" size={22} color={accent} />
      <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$accent">
        {label}
      </Text>
    </XStack>
  );
}
