import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { PremiumSheet } from '@/components/circle/PremiumSheet';
import { Screen } from '@/components/Screen';
import { Avatar, AvatarStack } from '@/components/social/Avatar';
import { FriendsReadingNow } from '@/components/social/FriendsReadingNow';
import { Leaderboard } from '@/components/social/Leaderboard';
import { useAuth } from '@/features/auth/auth-context';
import {
  type CircleSummary,
  FREE_CIRCLE_LIMIT,
  useCircles,
  useCreateCircle,
  useJoinCircle,
  useUnreadCounts,
} from '@/features/circles/use-circles';
import { type FriendPerson, useFriendships } from '@/features/social/use-friends';
import { useFriendsLeaderboard } from '@/features/social/use-leaderboard';
import { palette } from '@/theme/tokens';

/** Each circle gets one of the four "tranches" as its accent, by position. */
const TRANCHES = [palette.brick, palette.prussian, palette.forest, palette.gold];

// Eyebrow in INK (refonte) — legible on parchment, unified across the app.
function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.8}
      textTransform="uppercase"
      color="$color"
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

function FriendsRow({
  friends,
  incoming,
  onOpenReaders,
  onOpenFriend,
}: {
  friends: FriendPerson[];
  incoming: number;
  onOpenReaders: () => void;
  onOpenFriend: (id: string) => void;
}) {
  return (
    <YStack gap="$3" marginBottom="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <Label>Mes amis</Label>
        <Text
          onPress={onOpenReaders}
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          color="$accent"
          pressStyle={{ opacity: 0.6 }}
        >
          {incoming > 0 ? `Demandes · ${incoming}` : 'Découvrir'}
        </Text>
      </XStack>

      {friends.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$4" paddingRight="$4">
            {friends.map((f) => (
              <Pressable key={f.user_id} onPress={() => onOpenFriend(f.user_id)}>
                <YStack alignItems="center" gap="$1" width={64}>
                  <Avatar path={f.avatar_path} name={f.display_name} pseudo={f.pseudo} size={56} />
                  <Text
                    fontFamily="$body"
                    fontSize={12}
                    color="$colorSoft"
                    numberOfLines={1}
                    textAlign="center"
                  >
                    {f.display_name || f.pseudo || 'Lecteur'}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </ScrollView>
      ) : (
        <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={20}>
          Pas encore d'amis. Découvrez des lecteurs qui partagent vos goûts.
        </Text>
      )}
    </YStack>
  );
}

function CircleCard({
  circle,
  accent,
  unread,
  onPress,
  onPremium,
}: {
  circle: CircleSummary;
  accent: string;
  unread: number;
  onPress: () => void;
  onPremium: () => void;
}) {
  const full = circle.memberCount >= FREE_CIRCLE_LIMIT && !circle.isPremium;
  return (
    <Pressable onPress={onPress}>
      <XStack
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={14}
        overflow="hidden"
      >
        {/* tranche accent — what makes each circle read differently */}
        <YStack width={6} backgroundColor={accent} />
        <YStack flex={1} padding="$4" gap="$3">
          <XStack alignItems="center" gap="$3">
            <YStack flex={1} gap="$1">
              <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={1}>
                {circle.name}
              </Text>
              <XStack alignItems="center" gap="$2" flexWrap="wrap">
                <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
                  {circle.memberCount} membre{circle.memberCount > 1 ? 's' : ''} · code{' '}
                  {circle.invite_code}
                </Text>
                {circle.isPremium ? (
                  <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.gold}>
                    PREMIUM
                  </Text>
                ) : full ? (
                  <Text
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onPremium();
                    }}
                    fontFamily="$body"
                    fontSize={11}
                    fontWeight="700"
                    color={palette.gold}
                    pressStyle={{ opacity: 0.6 }}
                  >
                    COMPLET · PREMIUM
                  </Text>
                ) : null}
              </XStack>
            </YStack>
            {unread > 0 ? (
              <XStack
                minWidth={22}
                height={22}
                paddingHorizontal={6}
                borderRadius={999}
                backgroundColor={palette.brick}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontFamily="$body" fontSize={12} fontWeight="700" color={palette.paper}>
                  {unread}
                </Text>
              </XStack>
            ) : null}
            <Text fontFamily="$heading" fontSize={22} color="$colorMuted">
              ›
            </Text>
          </XStack>

          {circle.members.length > 0 ? (
            <AvatarStack people={circle.members} max={5} size={30} />
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  );
}

export default function DiscussionsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: circles, isLoading } = useCircles(userId);
  const { data: unread } = useUnreadCounts(userId);
  const { data: friendships } = useFriendships(userId);
  const { data: leaderboard } = useFriendsLeaderboard(userId);
  const incomingCount = friendships?.incoming.length ?? 0;
  const createCircle = useCreateCircle(userId);
  const joinCircle = useJoinCircle(userId);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  // null = closed; an object (with optional circle name) = the upsell sheet is open.
  const [premium, setPremium] = useState<{ name: string | null } | null>(null);
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
      const msg = e instanceof Error ? e.message : 'Erreur';
      if (msg.includes('circle_full_free')) {
        setError(`Ce cercle est complet (limite gratuite de ${FREE_CIRCLE_LIMIT} membres).`);
        setPremium({ name: null });
      } else if (msg.includes('circle_not_found')) {
        setError("Aucun cercle avec ce code d'invitation.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}
      >
        <XStack gap="$1" marginBottom="$5" alignItems="flex-end" justifyContent="space-between">
          <YStack gap="$1">
            <Label>Échanges</Label>
            <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
              Amis & cercles
            </Text>
          </YStack>
          <XStack gap="$2">
            <Button
              onPress={() => router.push('/carte')}
              height={34}
              paddingHorizontal="$3"
              borderRadius={999}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="transparent"
              color="$colorSoft"
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
              pressStyle={{ opacity: 0.7 }}
            >
              Carte
            </Button>
            <Button
              onPress={() => router.push('/readers')}
              height={34}
              paddingHorizontal="$3"
              borderRadius={999}
              borderWidth={1}
              borderColor="$accent"
              backgroundColor="transparent"
              color="$accent"
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
              pressStyle={{ opacity: 0.7 }}
            >
              {incomingCount > 0 ? `Lecteurs · ${incomingCount}` : 'Lecteurs'}
            </Button>
          </XStack>
        </XStack>

        <FriendsRow
          friends={friendships?.friends ?? []}
          incoming={incomingCount}
          onOpenReaders={() => router.push('/readers')}
          onOpenFriend={(id) => router.push(`/u/${id}`)}
        />

        <FriendsReadingNow userId={userId} />

        {(leaderboard?.length ?? 0) >= 2 ? (
          <YStack gap="$3" marginBottom="$5">
            <Label>Classement · cette semaine</Label>
            <Leaderboard rows={leaderboard} myId={userId} />
          </YStack>
        ) : null}

        <YStack gap="$3" marginBottom="$5">
          <Label>Nouveau cercle</Label>
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

        <Label>Mes cercles</Label>
        <YStack marginTop="$3">
          {isLoading ? (
            <YStack alignItems="center" paddingVertical="$8">
              <Spinner color="$accent" size="large" />
            </YStack>
          ) : circles && circles.length > 0 ? (
            <YStack gap="$3">
              {circles.map((circle, i) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  accent={TRANCHES[i % TRANCHES.length]}
                  unread={unread?.get(circle.id) ?? 0}
                  onPress={() => router.push(`/circle/${circle.id}`)}
                  onPremium={() => setPremium({ name: circle.name })}
                />
              ))}
            </YStack>
          ) : (
            <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
              Aucun cercle pour le moment. Créez-en un, ou rejoignez celui d'un ami avec son code
              d'invitation.
            </Text>
          )}
        </YStack>
      </ScrollView>

      {premium ? (
        <PremiumSheet circleName={premium.name ?? undefined} onClose={() => setPremium(null)} />
      ) : null}
    </Screen>
  );
}
