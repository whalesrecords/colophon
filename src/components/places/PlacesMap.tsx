import { Linking } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { env } from '@/lib/env';
import { palette } from '@/theme/tokens';

/**
 * Native fallback — the interactive Leaflet map is web-only for now (a native
 * map needs react-native-maps + a dev build). Opens the web map instead.
 */
export function PlacesMap() {
  const url = `${env.webUrl ?? 'https://colophon-three.vercel.app'}/carte`;
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$3">
      <Text fontFamily="$heading" fontSize={22} color="$color" textAlign="center">
        Carte des lieux de lecture
      </Text>
      <Text fontFamily="$body" fontSize={15} color="$colorSoft" textAlign="center" lineHeight={22}>
        Librairies, festivals, cafés philo et cercles de lecture partout en France. La carte
        interactive s’ouvre sur le web.
      </Text>
      <Button
        onPress={() => Linking.openURL(url)}
        backgroundColor="$accent"
        color={palette.paper}
        borderRadius={12}
        height={48}
        paddingHorizontal="$5"
        fontFamily="$body"
        fontWeight="600"
      >
        Ouvrir la carte
      </Button>
    </YStack>
  );
}
