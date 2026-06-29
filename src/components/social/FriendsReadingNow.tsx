import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Avatar } from '@/components/social/Avatar';
import { useFriendsCurrentReading } from '@/features/social/use-friends';

/**
 * "En ce moment" — a horizontal strip of what friends are reading right now.
 * Only friends who kept "partager ma lecture du moment" on appear (server-enforced
 * in the friends_current_reading RPC). Renders nothing when no one is sharing.
 */
export function FriendsReadingNow({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const { data } = useFriendsCurrentReading(userId);
  if (!data || data.length === 0) return null;

  return (
    <YStack gap="$3" marginBottom="$5">
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="700"
        letterSpacing={1.8}
        textTransform="uppercase"
        color="$color"
      >
        En ce moment
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$3">
          {data.map((fr) => {
            const name = fr.display_name || fr.pseudo || 'Un lecteur';
            const page = fr.current_page ?? 0;
            const progress =
              page > 0
                ? fr.total_pages && fr.total_pages > 0
                  ? `p. ${page} / ${fr.total_pages}`
                  : `p. ${page}`
                : null;
            return (
              <Pressable key={fr.user_id} onPress={() => router.push(`/u/${fr.user_id}`)}>
                <YStack width={88} gap="$2" alignItems="center">
                  <BookCover
                    title={fr.title ?? '—'}
                    coverUrl={fr.cover_url}
                    isbn={fr.isbn13}
                    width={84}
                  />
                  <XStack gap="$1.5" alignItems="center" maxWidth={88}>
                    <Avatar path={fr.avatar_path} name={name} pseudo={fr.pseudo} size={18} />
                    <Text
                      fontFamily="$body"
                      fontSize={11.5}
                      fontWeight="600"
                      color="$colorSoft"
                      numberOfLines={1}
                      flexShrink={1}
                    >
                      {name}
                    </Text>
                  </XStack>
                  {progress ? (
                    <Text
                      fontFamily="$body"
                      fontSize={10.5}
                      color="$colorMuted"
                      numberOfLines={1}
                      marginTop={-4}
                    >
                      {progress}
                    </Text>
                  ) : null}
                </YStack>
              </Pressable>
            );
          })}
        </XStack>
      </ScrollView>
    </YStack>
  );
}
