import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/social/Avatar';
import { useAuth } from '@/features/auth/auth-context';
import { type FeedEntry, useReadingFeed } from '@/features/social/use-follow';
import { palette } from '@/theme/tokens';

function fmtDate(d: string): string {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

function fmtRating(r: number): string {
  return r.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}

function FeedRow({ entry, onActor }: { entry: FeedEntry; onActor: () => void }) {
  const name = entry.display_name || entry.pseudo || 'Un lecteur';
  return (
    <XStack
      gap="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={14}
      padding="$3"
    >
      <BookCover
        title={entry.title ?? ''}
        coverUrl={entry.cover_url}
        isbn={entry.isbn13 ?? undefined}
        width={52}
      />
      <YStack flex={1} gap="$1.5" justifyContent="center">
        <Pressable onPress={onActor}>
          <XStack alignItems="center" gap="$2">
            <Avatar path={entry.avatar_path} name={name} pseudo={entry.pseudo} size={22} />
            <Text
              fontFamily="$body"
              fontSize={13}
              color="$colorSoft"
              numberOfLines={1}
              flexShrink={1}
            >
              <Text fontWeight="700" color="$color">
                {name}
              </Text>{' '}
              a terminé
            </Text>
          </XStack>
        </Pressable>
        <Text fontFamily="$heading" fontSize={15} fontWeight="600" color="$color" numberOfLines={2}>
          {entry.title ?? 'Sans titre'}
        </Text>
        {entry.body ? (
          <Text
            fontFamily="$body"
            fontSize={13}
            color="$colorSoft"
            lineHeight={19}
            numberOfLines={4}
            fontStyle="italic"
          >
            « {entry.body} »
          </Text>
        ) : null}
        <XStack alignItems="center" justifyContent="space-between">
          {entry.rating ? (
            <Text fontFamily="$body" fontSize={12.5} fontWeight="600" color={palette.gold}>
              ★ {fmtRating(entry.rating)}
            </Text>
          ) : (
            <YStack />
          )}
          <Text fontFamily="$body" fontSize={11} color="$colorMuted">
            {fmtDate(entry.finished_on)}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: feed, isLoading } = useReadingFeed(session?.user.id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discussions'));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
      >
        <Text
          onPress={goBack}
          fontFamily="$body"
          fontSize={15}
          color="$accent"
          fontWeight="600"
          paddingVertical="$2"
          marginBottom="$2"
          pressStyle={{ opacity: 0.6 }}
        >
          ‹ Retour
        </Text>
        <YStack gap="$1" marginBottom="$5">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1.8}
            textTransform="uppercase"
            color="$color"
          >
            Fil de lecture
          </Text>
          <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
            Ce que lit ton réseau
          </Text>
        </YStack>

        {isLoading ? (
          <YStack alignItems="center" paddingVertical="$8">
            <BookLoader />
          </YStack>
        ) : feed && feed.length > 0 ? (
          <YStack gap="$3">
            {feed.map((e, i) => (
              <FeedRow
                key={`${e.user_id}-${e.isbn13 ?? i}-${e.finished_on}`}
                entry={e}
                onActor={() => router.push(`/u/${e.user_id}`)}
              />
            ))}
          </YStack>
        ) : (
          <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
            Abonne-toi à des lecteurs (bouton « Suivre » sur leur profil) pour voir ici les livres
            qu'ils terminent.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
