import { Modal } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { FREE_CIRCLE_LIMIT } from '@/features/circles/use-circles';
import { palette } from '@/theme/tokens';

const PRICE = '1,99 $';

function Check() {
  return (
    <Text fontFamily="$body" fontSize={15} color={palette.forest} fontWeight="700">
      ✓
    </Text>
  );
}

/**
 * Upsell shown when a circle hits the free member cap. Payment isn't wired yet
 * (Apple IAP comes with a native build) — the CTA just confirms interest.
 */
export function PremiumSheet({
  circleName,
  onClose,
}: {
  circleName?: string;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <YStack flex={1} paddingHorizontal="$5" paddingTop={56} paddingBottom="$6" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontFamily="$body"
              fontSize={12}
              fontWeight="600"
              letterSpacing={3}
              textTransform="uppercase"
              color="$colorMuted"
            >
              Premium
            </Text>
            <Text
              onPress={onClose}
              fontFamily="$body"
              fontSize={15}
              fontWeight="600"
              color="$accent"
              pressStyle={{ opacity: 0.6 }}
            >
              Fermer
            </Text>
          </XStack>

          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color">
              Agrandissez votre cercle
            </Text>
            <Text fontFamily="$body" fontSize={15} lineHeight={22} color="$colorSoft">
              {circleName ? `« ${circleName} » a atteint ` : 'Ce cercle a atteint '}
              la limite gratuite de {FREE_CIRCLE_LIMIT} membres. Passez en Premium pour inviter
              au-delà.
            </Text>
          </YStack>

          <YStack
            padding="$4"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundStrong"
            gap="$3"
          >
            <XStack alignItems="baseline" gap="$2">
              <Text fontFamily="$heading" fontSize={34} fontWeight="600" color="$color">
                {PRICE}
              </Text>
              <Text fontFamily="$body" fontSize={14} color="$colorMuted">
                / membre / mois
              </Text>
            </XStack>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Check />
                <Text fontFamily="$body" fontSize={14} color="$colorSoft">
                  Cercles de plus de {FREE_CIRCLE_LIMIT} membres
                </Text>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <Check />
                <Text fontFamily="$body" fontSize={14} color="$colorSoft">
                  Discussions en temps réel, agenda & rendez-vous
                </Text>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <Check />
                <Text fontFamily="$body" fontSize={14} color="$colorSoft">
                  Facturé seulement pour les membres au-delà du palier gratuit
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack gap="$2" marginTop="auto">
            <Button
              onPress={onClose}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={12}
              height={52}
              fontFamily="$body"
              fontWeight="600"
              fontSize={16}
              disabled
              opacity={0.9}
            >
              Bientôt disponible
            </Button>
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" textAlign="center">
              Le paiement arrive avec l’app iOS (App Store). En attendant, les cercles restent
              gratuits jusqu’à {FREE_CIRCLE_LIMIT} membres.
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
