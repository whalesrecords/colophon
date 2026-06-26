import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { useCircles, useCreateCircle, useJoinCircle } from '@/features/circles/use-circles';
import { palette } from '@/theme/tokens';

function Label({ children }: { children: string }) {
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

const inputProps = {
  placeholderTextColor: '$concreteLight' as const,
  backgroundColor: '$background' as const,
  borderColor: '$borderColor' as const,
  borderWidth: 1,
  borderRadius: 12,
  height: 44,
  paddingHorizontal: '$3' as const,
  fontFamily: '$body' as const,
  fontSize: 14,
  color: '$color' as const,
};

export default function DiscussionsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: circles, isLoading } = useCircles(userId);
  const createCircle = useCreateCircle(userId);
  const joinCircle = useJoinCircle(userId);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 720) / 2);

  const onCreate = async () => {
    const n = name.trim();
    if (!n) return;
    setName('');
    setError(null);
    try {
      const circle = await createCircle.mutateAsync(n);
      router.push(`/circle/${circle.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const onJoin = async () => {
    const c = code.trim();
    if (!c) return;
    setCode('');
    setError(null);
    try {
      const circle = await joinCircle.mutateAsync(c);
      router.push(`/circle/${circle.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}>
        <YStack gap="$1" marginBottom="$5">
          <Label>Échanges</Label>
          <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
            Cercles de lecture
          </Text>
        </YStack>

        <YStack gap="$3" marginBottom="$6">
          <XStack gap="$2">
            <Input
              flex={1}
              {...inputProps}
              placeholder="Nom d'un nouveau cercle…"
              value={name}
              onChangeText={setName}
              onSubmitEditing={onCreate}
            />
            <Button
              onPress={onCreate}
              disabled={createCircle.isPending}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={12}
              height={44}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
            >
              Créer
            </Button>
          </XStack>
          <XStack gap="$2">
            <Input
              flex={1}
              {...inputProps}
              autoCapitalize="none"
              placeholder="Code d'invitation…"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={onJoin}
            />
            <Button
              onPress={onJoin}
              disabled={joinCircle.isPending}
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              color="$color"
              borderRadius={12}
              height={44}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
            >
              Rejoindre
            </Button>
          </XStack>
          {error ? (
            <Text fontFamily="$body" fontSize={13} color="$signal">
              {error}
            </Text>
          ) : null}
        </YStack>

        {isLoading ? (
          <YStack alignItems="center" paddingVertical="$8">
            <Spinner color="$accent" size="large" />
          </YStack>
        ) : circles && circles.length > 0 ? (
          <YStack gap="$2">
            {circles.map((circle) => (
              <Pressable key={circle.id} onPress={() => router.push(`/circle/${circle.id}`)}>
                <XStack
                  alignItems="center"
                  gap="$3"
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={12}
                  padding="$4"
                >
                  <YStack flex={1} gap="$1">
                    <Text fontFamily="$heading" fontSize={17} color="$color">
                      {circle.name}
                    </Text>
                    <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                      {circle.memberCount} membre{circle.memberCount > 1 ? 's' : ''} · code{' '}
                      {circle.invite_code}
                    </Text>
                  </YStack>
                  <Text fontFamily="$heading" fontSize={22} color="$colorMuted">
                    ›
                  </Text>
                </XStack>
              </Pressable>
            ))}
          </YStack>
        ) : (
          <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
            Aucun cercle pour le moment. Créez-en un, ou rejoignez celui d'un ami avec son code
            d'invitation.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
