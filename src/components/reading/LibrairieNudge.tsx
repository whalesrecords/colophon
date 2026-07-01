import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { useSnooze } from '@/features/engagement/use-snooze';
import { palette } from '@/theme/tokens';

const SNOOZE_KEY = 'colophon.nudge.librairie';
/** Shown at most once every ~5 days — a calm suggestion, never a nag. */
const COOLDOWN = 5 * 24 * 60 * 60 * 1000;

/**
 * A calm footer prompt on Home: for the next read, point the reader to a physical
 * independent bookshop near them (never Amazon — the app's ethos). Opens the in-app
 * carte (`/carte`) which geolocates and centres on the reader, showing the ~4800
 * indie bookshops from the places dataset. Escapable ("Plus tard" → hidden ~5 days)
 * and only surfaced to active readers (`eligible`).
 */
export function LibrairieNudge({ eligible = true }: { eligible?: boolean }) {
  const { active, snooze } = useSnooze(SNOOZE_KEY, COOLDOWN);
  const router = useRouter();

  if (!active || !eligible) return null;

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={18}
      padding={16}
      gap="$3"
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
            Pour ton prochain livre
          </Text>
          <Text fontFamily="$heading" fontSize={17} fontWeight="600" color="$color">
            Et si c’était chez un libraire indé ?
          </Text>
        </YStack>
      </XStack>

      <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
        Une librairie indépendante près de chez toi — jamais Amazon.
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
          Librairies près de moi
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
