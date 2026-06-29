import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, XStack, YStack } from 'tamagui';

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
        <Button
          onPress={() => router.push('/mes-lieux')}
          height={32}
          paddingHorizontal="$3"
          borderRadius={999}
          borderWidth={1}
          borderColor="$accent"
          backgroundColor="transparent"
          color="$accent"
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          pressStyle={{ opacity: 0.7 }}
        >
          ♥ Mes lieux
        </Button>
        <Button
          onPress={() => router.push('/boites')}
          height={32}
          paddingHorizontal="$3"
          borderRadius={999}
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="transparent"
          color="$color"
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          pressStyle={{ opacity: 0.7 }}
        >
          📚 Boîtes
        </Button>
      </XStack>
      <PlacesMap />
    </YStack>
  );
}
