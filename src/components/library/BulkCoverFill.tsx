import { Modal, ScrollView } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookLoader } from '@/components/BookLoader';
import { missingCover, useBulkCoverFill } from '@/features/library/use-bulk-cover-fill';
import type { LibraryItem } from '@/features/library/use-library';
import { palette } from '@/theme/tokens';

interface BulkCoverFillProps {
  items: LibraryItem[];
  userId: string | undefined;
  onClose: () => void;
}

/**
 * Library-wide deep cover search: rescue every cover-less book in one pass.
 * Shown in a full-screen Modal so it sits above the tab bar everywhere.
 */
export function BulkCoverFill({ items, userId, onClose }: BulkCoverFillProps) {
  const { run, cancel, progress } = useBulkCoverFill(userId);
  const missing = items.filter(missingCover);
  const finished = !progress.running && progress.total > 0;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 24,
          }}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontFamily="$body"
              fontSize={12}
              fontWeight="600"
              letterSpacing={3}
              textTransform="uppercase"
              color="$colorMuted"
            >
              Couvertures
            </Text>
            <Text
              onPress={() => {
                cancel();
                onClose();
              }}
              fontFamily="$body"
              fontSize={15}
              fontWeight="600"
              color="$accent"
              pressStyle={{ opacity: 0.6 }}
            >
              Fermer
            </Text>
          </XStack>

          <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color" marginTop="$3">
            Recherche approfondie
          </Text>
          <Text fontFamily="$body" fontSize={15} lineHeight={22} color="$colorSoft" marginTop="$2">
            Trouve une couverture pour les livres qui n’en ont pas (Google, Open Library, BnF,
            AniList) et l’applique automatiquement. Tu pourras toujours en changer ensuite depuis la
            fiche du livre.
          </Text>

          <YStack
            marginTop="$5"
            padding="$4"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundStrong"
            gap="$3"
          >
            {progress.running ? (
              <YStack gap="$3" alignItems="center">
                <BookLoader size={56} />
                <Text fontFamily="$heading" fontSize={22} fontWeight="500" color="$color">
                  {progress.done} / {progress.total}
                </Text>
                <YStack
                  width="100%"
                  height={6}
                  borderRadius={999}
                  backgroundColor="$track"
                  overflow="hidden"
                >
                  <YStack height={6} width={`${pct}%`} backgroundColor="$accent" />
                </YStack>
                <Text fontFamily="$body" fontSize={14} color="$colorSoft">
                  {progress.found} couverture{progress.found > 1 ? 's' : ''} trouvée
                  {progress.found > 1 ? 's' : ''}
                </Text>
                <Button
                  onPress={cancel}
                  chromeless
                  height={40}
                  color="$signal"
                  fontFamily="$body"
                  fontWeight="600"
                >
                  Arrêter
                </Button>
              </YStack>
            ) : finished ? (
              <YStack gap="$2" alignItems="center">
                <Text fontFamily="$heading" fontSize={22} fontWeight="500" color="$color">
                  {progress.found} couverture{progress.found > 1 ? 's' : ''} ajoutée
                  {progress.found > 1 ? 's' : ''}
                </Text>
                <Text fontFamily="$body" fontSize={14} color="$colorSoft" textAlign="center">
                  sur {progress.total} livre{progress.total > 1 ? 's' : ''} sans couverture.
                  {progress.total - progress.found > 0
                    ? ` ${progress.total - progress.found} introuvable${
                        progress.total - progress.found > 1 ? 's' : ''
                      } — colle une URL dans la fiche du livre.`
                    : ''}
                </Text>
                <Button
                  onPress={onClose}
                  marginTop="$2"
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={12}
                  height={48}
                  paddingHorizontal="$5"
                  fontFamily="$body"
                  fontWeight="600"
                >
                  Terminé
                </Button>
              </YStack>
            ) : missing.length === 0 ? (
              <Text fontFamily="$body" fontSize={15} color="$colorSoft" textAlign="center">
                Tous vos livres ont déjà une couverture. 🎉
              </Text>
            ) : (
              <YStack gap="$3" alignItems="center">
                <Text fontFamily="$body" fontSize={15} color="$color" textAlign="center">
                  {missing.length} livre{missing.length > 1 ? 's' : ''} sans couverture.
                </Text>
                <Button
                  onPress={() => run(items)}
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={12}
                  height={52}
                  paddingHorizontal="$5"
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={16}
                >
                  Lancer la recherche
                </Button>
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </Modal>
  );
}
