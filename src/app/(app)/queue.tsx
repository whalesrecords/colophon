import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { Icon } from '@/components/icons';
import { BackLink } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  type QueueItem,
  useQueueActions,
  useReadingQueue,
} from '@/features/reading/use-reading-queue';
import { palette } from '@/theme/tokens';

function Section({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={2.4}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

function Cover({ item }: { item: QueueItem }) {
  return (
    <BookCover
      title={item.title}
      coverUrl={item.coverUrl}
      isbn={item.isbn13 ?? undefined}
      width={40}
    />
  );
}

export default function QueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data, isLoading } = useReadingQueue(userId);
  const { setOrder, addToQueue, removeFromQueue } = useQueueActions(userId);

  const queue = data?.queue ?? [];
  const rest = data?.rest ?? [];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= queue.length) return;
    const ids = queue.map((q) => q.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setOrder.mutate(ids);
  };

  const empty = !isLoading && queue.length === 0 && rest.length === 0;

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingTop={insets.top + 8} paddingBottom="$2" paddingHorizontal="$4">
        <BackLink />
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }}>
        <YStack gap="$2" marginBottom="$4">
          <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
            File de lecture
          </Text>
          <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
            Ordonnez ce que vous voulez lire en priorité. Le reste de votre pile à lire est en
            dessous.
          </Text>
        </YStack>

        {isLoading ? (
          <XStack justifyContent="center" paddingVertical="$8">
            <BookLoader size={48} />
          </XStack>
        ) : empty ? (
          <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
            Aucun livre « À lire » pour l'instant. Marquez un livre « À lire » et il apparaîtra ici.
          </Text>
        ) : (
          <YStack gap="$6">
            {queue.length ? (
              <YStack gap="$3">
                <Section>{`Ma file · ${queue.length}`}</Section>
                {queue.map((item, i) => (
                  <XStack key={item.id} gap="$3" alignItems="center">
                    <Text
                      fontFamily="$heading"
                      fontSize={16}
                      color="$accent"
                      width={20}
                      textAlign="center"
                    >
                      {i + 1}
                    </Text>
                    <XStack
                      flex={1}
                      gap="$3"
                      alignItems="center"
                      onPress={() => router.push(`/book/${item.id}`)}
                      pressStyle={{ opacity: 0.7 }}
                      cursor="pointer"
                    >
                      <Cover item={item} />
                      <YStack flex={1}>
                        <Text
                          fontFamily="$body"
                          fontSize={14}
                          fontWeight="600"
                          color="$color"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.author ? (
                          <Text
                            fontFamily="$body"
                            fontSize={12}
                            color="$colorMuted"
                            numberOfLines={1}
                          >
                            {item.author}
                          </Text>
                        ) : null}
                      </YStack>
                    </XStack>
                    <XStack alignItems="center">
                      <Button
                        onPress={() => move(i, i - 1)}
                        disabled={i === 0}
                        chromeless
                        height={44}
                        width={44}
                        padding={0}
                        alignItems="center"
                        justifyContent="center"
                        accessibilityLabel="Monter dans la file"
                      >
                        <Icon
                          name="chevronUp"
                          size={20}
                          color={i === 0 ? palette.concrete : palette.ink}
                        />
                      </Button>
                      <Button
                        onPress={() => move(i, i + 1)}
                        disabled={i === queue.length - 1}
                        chromeless
                        height={44}
                        width={44}
                        padding={0}
                        alignItems="center"
                        justifyContent="center"
                        accessibilityLabel="Descendre dans la file"
                      >
                        <Icon
                          name="chevronDown"
                          size={20}
                          color={i === queue.length - 1 ? palette.concrete : palette.ink}
                        />
                      </Button>
                      <Button
                        onPress={() => removeFromQueue.mutate(item.id)}
                        chromeless
                        height={44}
                        width={44}
                        padding={0}
                        alignItems="center"
                        justifyContent="center"
                        accessibilityLabel="Retirer de la file"
                      >
                        <Icon name="close" size={18} color={palette.concrete} />
                      </Button>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            ) : null}

            {rest.length ? (
              <YStack gap="$3">
                <Section>Pile à lire</Section>
                {rest.map((item) => (
                  <XStack key={item.id} gap="$3" alignItems="center">
                    <XStack
                      flex={1}
                      gap="$3"
                      alignItems="center"
                      onPress={() => router.push(`/book/${item.id}`)}
                      pressStyle={{ opacity: 0.7 }}
                      cursor="pointer"
                    >
                      <Cover item={item} />
                      <YStack flex={1}>
                        <Text
                          fontFamily="$body"
                          fontSize={14}
                          fontWeight="600"
                          color="$color"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.author ? (
                          <Text
                            fontFamily="$body"
                            fontSize={12}
                            color="$colorMuted"
                            numberOfLines={1}
                          >
                            {item.author}
                          </Text>
                        ) : null}
                      </YStack>
                    </XStack>
                    <Button
                      onPress={() => addToQueue.mutate({ itemId: item.id, atEnd: queue.length })}
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
                    >
                      + Prioriser
                    </Button>
                  </XStack>
                ))}
              </YStack>
            ) : null}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
