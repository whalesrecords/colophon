import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { BackLink } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useFollowActions, useFollowCounts, useIsFollowing } from '@/features/social/use-follow';
import { avatarUrl, useFriendActions, useReaderProfile } from '@/features/social/use-friends';
import { palette } from '@/theme/tokens';

function Chips({ items }: { items: string[] }) {
  return (
    <XStack flexWrap="wrap" gap="$2">
      {items.map((v) => (
        <XStack
          key={v}
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius={999}
          backgroundColor="$backgroundStrong"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontFamily="$body" fontSize={13} color="$color">
            {v}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
}

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

export default function ReaderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: profile, isLoading } = useReaderProfile(id);
  const { sendRequest, accept, remove } = useFriendActions(session?.user.id);
  const { data: following } = useIsFollowing(id, session?.user.id);
  const { data: followCounts } = useFollowCounts(id);
  const { follow, unfollow } = useFollowActions(session?.user.id);

  const url = profile ? avatarUrl(profile.avatar_path) : null;
  const name = profile?.display_name || profile?.pseudo || 'Lecteur';

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingTop={insets.top + 8} paddingBottom="$2" paddingHorizontal="$4">
        <BackLink />
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }}>
        {isLoading ? (
          <XStack justifyContent="center" paddingVertical="$8">
            <BookLoader size={48} />
          </XStack>
        ) : !profile ? (
          <Text fontFamily="$body" fontSize={14} color="$colorMuted">
            Lecteur introuvable.
          </Text>
        ) : (
          <YStack gap="$5">
            <YStack alignItems="center" gap="$3">
              {url ? (
                <Image
                  source={{ uri: url }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                  contentFit="cover"
                />
              ) : (
                <YStack
                  width={88}
                  height={88}
                  borderRadius={44}
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontFamily="$heading" fontSize={34} color="$colorSoft">
                    {name.slice(0, 1).toUpperCase()}
                  </Text>
                </YStack>
              )}
              <YStack alignItems="center" gap="$1">
                <Text fontFamily="$heading" fontSize={24} fontWeight="500" color="$color">
                  {name}
                </Text>
                {profile.pseudo ? (
                  <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                    @{profile.pseudo}
                  </Text>
                ) : null}
              </YStack>
              {profile.bio ? (
                <Text
                  fontFamily="$body"
                  fontSize={14}
                  color="$colorSoft"
                  textAlign="center"
                  lineHeight={20}
                  maxWidth={420}
                >
                  {profile.bio}
                </Text>
              ) : null}

              <XStack gap="$2" alignItems="center">
                <FriendButton
                  status={profile.friend_status}
                  onAdd={() => sendRequest.mutate(profile.user_id)}
                  onAccept={() => accept.mutate(profile.user_id)}
                  onRemove={() => remove.mutate(profile.user_id)}
                />
                {profile.friend_status !== 'self' ? (
                  <Button
                    onPress={() =>
                      following ? unfollow.mutate(profile.user_id) : follow.mutate(profile.user_id)
                    }
                    height={40}
                    paddingHorizontal="$4"
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={following ? '$borderColor' : '$accent'}
                    backgroundColor="transparent"
                    color={following ? '$colorSoft' : '$accent'}
                    fontFamily="$body"
                    fontSize={14}
                    fontWeight="600"
                  >
                    {following ? 'Suivi ✓' : 'Suivre'}
                  </Button>
                ) : null}
              </XStack>
            </YStack>

            <XStack alignItems="center" justifyContent="center" gap="$6">
              <YStack alignItems="center">
                <Text fontFamily="$heading" fontSize={28} color={palette.terracotta}>
                  {profile.books}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                  livres
                </Text>
              </YStack>
              <YStack width={1} height={40} backgroundColor="$borderColor" />
              <YStack alignItems="center">
                <Text fontFamily="$heading" fontSize={28} color={palette.aizome}>
                  {profile.read}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                  lus
                </Text>
              </YStack>
              <YStack width={1} height={40} backgroundColor="$borderColor" />
              <YStack alignItems="center">
                <Text fontFamily="$heading" fontSize={28} color={palette.sage}>
                  {followCounts?.followers ?? 0}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                  abonnés
                </Text>
              </YStack>
            </XStack>

            {profile.top_genres.length ? (
              <YStack gap="$3">
                <Section>Ses thématiques</Section>
                <Chips items={profile.top_genres} />
              </YStack>
            ) : null}

            {profile.top_authors.length ? (
              <YStack gap="$3">
                <Section>Ses auteurs</Section>
                <Chips items={profile.top_authors} />
              </YStack>
            ) : null}

            {profile.recent.length ? (
              <YStack gap="$3">
                <Section>Ses dernières lectures</Section>
                <XStack flexWrap="wrap" gap={12}>
                  {profile.recent.map((b, i) => (
                    <BookCover
                      key={b.isbn13 ?? i}
                      title={b.title ?? ''}
                      coverUrl={b.cover_url}
                      isbn={b.isbn13 ?? undefined}
                      width={64}
                    />
                  ))}
                </XStack>
              </YStack>
            ) : null}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}

function FriendButton({
  status,
  onAdd,
  onAccept,
  onRemove,
}: {
  status: string;
  onAdd: () => void;
  onAccept: () => void;
  onRemove: () => void;
}) {
  if (status === 'self') return null;
  if (status === 'friends') {
    return (
      <XStack gap="$2" alignItems="center">
        <YStack
          paddingHorizontal="$4"
          height={40}
          borderRadius={999}
          backgroundColor="$backgroundStrong"
          borderWidth={1}
          borderColor="$borderColor"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontFamily="$body" fontSize={14} fontWeight="600" color={palette.sage}>
            Amis ✓
          </Text>
        </YStack>
        <Button
          onPress={onRemove}
          chromeless
          height={40}
          color="$colorMuted"
          fontFamily="$body"
          fontSize={13}
        >
          Retirer
        </Button>
      </XStack>
    );
  }
  if (status === 'pending_in') {
    return (
      <Button
        onPress={onAccept}
        height={44}
        paddingHorizontal="$5"
        borderRadius={999}
        backgroundColor="$accent"
        color={palette.paper}
        fontFamily="$body"
        fontWeight="600"
      >
        Accepter la demande
      </Button>
    );
  }
  if (status === 'pending_out') {
    return (
      <Button
        onPress={onRemove}
        height={44}
        paddingHorizontal="$5"
        borderRadius={999}
        backgroundColor="$backgroundStrong"
        borderWidth={1}
        borderColor="$borderColor"
        color="$colorMuted"
        fontFamily="$body"
        fontWeight="600"
      >
        Demande envoyée · annuler
      </Button>
    );
  }
  return (
    <Button
      onPress={onAdd}
      height={44}
      paddingHorizontal="$5"
      borderRadius={999}
      backgroundColor="$accent"
      color={palette.paper}
      fontFamily="$body"
      fontWeight="600"
      pressStyle={{ opacity: 0.9 }}
    >
      + Ajouter en ami
    </Button>
  );
}
