import { Button, Text, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  return (
    <Screen>
      <YStack paddingHorizontal="$6" paddingTop="$6" gap="$6">
        <YStack gap="$1">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="600"
            letterSpacing={2.4}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Profil
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={26}
            fontWeight="500"
            color="$color"
            numberOfLines={1}
          >
            {session?.user.email ?? 'Lecteur'}
          </Text>
        </YStack>

        <Text fontFamily="$body" fontSize={15} color="$colorMuted" lineHeight={22}>
          Vos statistiques de lecture — livres lus, pages, objectif annuel — arriveront en Phase 5,
          avec les réglages et la suppression de compte.
        </Text>

        <Button
          onPress={signOut}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={2}
          height={48}
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.85 }}
        >
          Se déconnecter
        </Button>
      </YStack>
    </Screen>
  );
}
