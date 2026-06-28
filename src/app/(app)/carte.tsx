import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';

import { PlacesMap } from '@/components/places/PlacesMap';

export default function CarteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text fontFamily="$heading" fontSize={24} color="$color">
            ‹
          </Text>
        </Pressable>
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={18} color="$color">
            Lieux de lecture
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            Librairies · festivals · cafés philo · cercles
          </Text>
        </YStack>
      </XStack>
      <PlacesMap />
    </YStack>
  );
}
