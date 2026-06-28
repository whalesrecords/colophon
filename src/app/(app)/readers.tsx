import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import {
  avatarUrl,
  type FriendPerson,
  type SuggestedReader,
  useFriendActions,
  useFriendships,
  useSuggestedReaders,
} from '@/features/social/use-friends';
import { palette } from '@/theme/tokens';

function initials(name: string | null, pseudo: string | null): string {
  const s = (name || pseudo || '?').trim();
  return s.slice(0, 1).toUpperCase();
}

function Avatar({
  path,
  name,
  pseudo,
  size = 44,
}: {
  path: string | null;
  name: string | null;
  pseudo: string | null;
  size?: number;
}) {
  const url = avatarUrl(path);
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontFamily="$heading" fontSize={size * 0.4} color="$colorSoft">
        {initials(name, pseudo)}
      </Text>
    </YStack>
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

export default function ReadersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: friendships } = useFriendships(userId);
  const { data: suggested } = useSuggestedReaders(userId);
  const { sendRequest, accept, remove } = useFriendActions(userId);

  const open = (id: string) => router.push(`/u/${id}`);

  const PersonRow = ({ p, right }: { p: FriendPerson; right?: React.ReactNode }) => (
    <XStack gap="$3" alignItems="center">
      <Pressable onPress={() => open(p.user_id)}>
        <Avatar path={p.avatar_path} name={p.display_name} pseudo={p.pseudo} />
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => open(p.user_id)}>
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={16} color="$color" numberOfLines={1}>
            {p.display_name || p.pseudo || 'Lecteur'}
          </Text>
          {p.pseudo ? (
            <Text fontFamily="$body" fontSize={12} color="$colorMuted">
              @{p.pseudo}
            </Text>
          ) : null}
        </YStack>
      </Pressable>
      {right}
    </XStack>
  );

  const incoming = friendships?.incoming ?? [];
  const friends = friendships?.friends ?? [];
  const suggestions = suggested ?? [];

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingTop={insets.top + 8} paddingBottom="$2" paddingHorizontal="$4">
        <Text
          onPress={() => router.back()}
          fontFamily="$body"
          fontSize={15}
          color="$accent"
          fontWeight="600"
          paddingVertical="$2"
          pressStyle={{ opacity: 0.6 }}
        >
          ‹ Retour
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }}>
        <YStack gap="$2" marginBottom="$4">
          <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
            Lecteurs
          </Text>
          <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
            Découvrez des lecteurs qui partagent vos thématiques, et ajoutez-les en ami.
          </Text>
        </YStack>

        <YStack gap="$6">
          {incoming.length ? (
            <YStack gap="$3">
              <Section>Demandes reçues</Section>
              {incoming.map((p) => (
                <PersonRow
                  key={p.user_id}
                  p={p}
                  right={
                    <XStack gap="$2">
                      <Button
                        onPress={() => accept.mutate(p.user_id)}
                        height={32}
                        paddingHorizontal="$3"
                        borderRadius={999}
                        backgroundColor="$accent"
                        color={palette.paper}
                        fontFamily="$body"
                        fontSize={13}
                        fontWeight="600"
                      >
                        Accepter
                      </Button>
                      <Button
                        onPress={() => remove.mutate(p.user_id)}
                        height={32}
                        paddingHorizontal="$3"
                        borderRadius={999}
                        chromeless
                        color="$colorMuted"
                        fontFamily="$body"
                        fontSize={13}
                      >
                        Refuser
                      </Button>
                    </XStack>
                  }
                />
              ))}
            </YStack>
          ) : null}

          {friends.length ? (
            <YStack gap="$3">
              <Section>{`Mes amis · ${friends.length}`}</Section>
              {friends.map((p) => (
                <PersonRow key={p.user_id} p={p} right={<Text color="$colorMuted">›</Text>} />
              ))}
            </YStack>
          ) : null}

          <YStack gap="$3">
            <Section>À découvrir</Section>
            {suggestions.length ? (
              suggestions.map((r: SuggestedReader) => (
                <PersonRow
                  key={r.user_id}
                  p={r}
                  right={
                    <YStack alignItems="flex-end" gap="$1">
                      <Button
                        onPress={() => sendRequest.mutate(r.user_id)}
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
                        + Ajouter
                      </Button>
                      {r.sample_genres?.length ? (
                        <Text
                          fontFamily="$body"
                          fontSize={11}
                          color="$colorMuted"
                          numberOfLines={1}
                        >
                          {r.sample_genres.slice(0, 2).join(' · ')}
                        </Text>
                      ) : null}
                    </YStack>
                  }
                />
              ))
            ) : (
              <Text fontFamily="$body" fontSize={13} color="$colorSoft" lineHeight={19}>
                Personne pour l'instant. Ajoutez quelques livres à votre bibliothèque pour qu'on
                vous propose des lecteurs aux goûts proches.
              </Text>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
