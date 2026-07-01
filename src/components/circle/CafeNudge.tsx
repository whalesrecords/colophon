import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { useSnooze } from '@/features/engagement/use-snooze';
import { palette } from '@/theme/tokens';

const SNOOZE_KEY = 'colophon.nudge.cafe';
const COOLDOWN = 7 * 24 * 60 * 60 * 1000;

/**
 * A calm prompt on Échanges: reading meet-ups (café-philo, book clubs) near the reader.
 * Opens the in-app carte (`/carte`) which geolocates + centres on them, showing the
 * café-philo / cercle pins from the places dataset. Snooze-gated (~a week), escapable.
 */
export function CafeNudge() {
  const { active, snooze } = useSnooze(SNOOZE_KEY, COOLDOWN);
  const router = useRouter();

  if (!active) return null;

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
          backgroundColor={palette.brick + '22'}
          alignItems="center"
          justifyContent="center"
        >
          <PackIcon name="location" size={20} color={palette.brick} />
        </YStack>
        <YStack flex={1} gap={2}>
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1.6}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Près de chez toi
          </Text>
          <Text fontFamily="$heading" fontSize={17} fontWeight="600" color="$color">
            Un café-philo ce mois-ci ?
          </Text>
        </YStack>
      </XStack>

      <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
        Des rencontres autour des livres, tout près.
      </Text>

      <XStack alignItems="center" justifyContent="space-between">
        <Button
          onPress={() => router.push('/carte?locate=1')}
          height={44}
          paddingHorizontal="$4"
          borderRadius={999}
          backgroundColor="$accent"
          color={palette.paper}
          fontFamily="$body"
          fontWeight="600"
          fontSize={14}
          pressStyle={{ opacity: 0.85 }}
        >
          Voir les rencontres
        </Button>
        <Pressable onPress={snooze} hitSlop={10} style={{ paddingVertical: 12 }}>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            Plus tard
          </Text>
        </Pressable>
      </XStack>
    </YStack>
  );
}
