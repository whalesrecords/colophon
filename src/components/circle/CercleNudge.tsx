import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { useSnooze } from '@/features/engagement/use-snooze';
import { useLibrary } from '@/features/library/use-library';
import { palette } from '@/theme/tokens';

const SNOOZE_KEY = 'colophon.nudge.cercle';
const COOLDOWN = 5 * 24 * 60 * 60 * 1000;

/** The reader's most-owned genre — the hook for a themed circle. */
function useTopGenre(userId: string | undefined): string | null {
  const { data: items } = useLibrary(userId);
  return useMemo(() => {
    if (!items) return null;
    const counts = new Map<string, number>();
    for (const it of items) {
      if (it.ownership === 'wishlist') continue;
      for (const g of it.book?.genres ?? []) {
        const key = g.trim();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    let best: string | null = null;
    let max = 0;
    for (const [g, n] of counts) {
      if (n > max) {
        max = n;
        best = g;
      }
    }
    // Only suggest when the taste is pronounced enough to name.
    return max >= 5 ? best : null;
  }, [items]);
}

/**
 * A contextual prompt on Échanges: the reader leans into one genre, so offer them a
 * circle to talk about it — pre-filling a real circle name (grounded: circles exist).
 * Snooze-gated (~5 days) and escapable, per the app's gentle-prompt guardrail.
 */
export function CercleNudge({
  userId,
  onCreate,
}: {
  userId: string | undefined;
  onCreate: (name: string) => void;
}) {
  const { active, snooze } = useSnooze(SNOOZE_KEY, COOLDOWN);
  const genre = useTopGenre(userId);

  if (!active || !genre) return null;

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={18}
      padding={16}
      gap="$3"
      marginBottom="$5"
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={40}
          height={40}
          borderRadius={999}
          backgroundColor={palette.prussian + '22'}
          alignItems="center"
          justifyContent="center"
        >
          <PackIcon name="heart" size={20} color={palette.prussian} />
        </YStack>
        <YStack flex={1} gap={2}>
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1.4}
            textTransform="uppercase"
            color={palette.prussian}
            numberOfLines={1}
          >
            Tu lis beaucoup de {genre}
          </Text>
          <Text fontFamily="$heading" fontSize={17} fontWeight="600" color="$color">
            Un cercle pour en parler ?
          </Text>
        </YStack>
      </XStack>

      <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
        Rejoins des lecteurs qui aiment les mêmes livres.
      </Text>

      <XStack alignItems="center" justifyContent="space-between">
        <Button
          onPress={() => onCreate(`Cercle ${genre}`)}
          height={42}
          paddingHorizontal="$4"
          borderRadius={999}
          backgroundColor="$accent"
          color={palette.paper}
          fontFamily="$body"
          fontWeight="600"
          fontSize={14}
          pressStyle={{ opacity: 0.85 }}
        >
          Créer ce cercle
        </Button>
        <Pressable onPress={snooze} hitSlop={8}>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            Plus tard
          </Text>
        </Pressable>
      </XStack>
    </YStack>
  );
}
