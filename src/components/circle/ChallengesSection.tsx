import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { Avatar } from '@/components/social/Avatar';
import {
  type ChallengeWithMe,
  type GoalType,
  useChallengeActions,
  useChallengeProgress,
  useCircleChallenges,
} from '@/features/social/use-challenges';
import { palette } from '@/theme/tokens';

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

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      height={36}
      paddingHorizontal="$3"
      borderRadius={999}
      borderWidth={1}
      borderColor={active ? '$accent' : '$borderColor'}
      backgroundColor={active ? '$accent' : 'transparent'}
      color={active ? palette.paper : '$colorMuted'}
      fontFamily="$body"
      fontSize={13}
      fontWeight="600"
    >
      {label}
    </Button>
  );
}

function unitLabel(t: GoalType): string {
  return t === 'pages' ? 'pages' : 'livres';
}

function daysLeft(endsOn: string): number {
  const end = new Date(`${endsOn}T23:59:59`).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function ChallengeCard({
  challenge,
  userId,
  onJoin,
  onLeave,
}: {
  challenge: ChallengeWithMe;
  userId: string | undefined;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  const { data: progress, isLoading } = useChallengeProgress(challenge.id);
  const left = daysLeft(challenge.ends_on);
  const unit = unitLabel(challenge.goal_type);
  const isOwner = challenge.created_by === userId;

  return (
    <YStack
      gap="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={14}
      padding="$3.5"
    >
      <XStack justifyContent="space-between" alignItems="flex-start" gap="$2">
        <YStack flex={1} gap="$1">
          <Text fontFamily="$heading" fontSize={17} fontWeight="600" color="$color">
            {challenge.title}
          </Text>
          <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
            {challenge.target} {unit} · {left === 0 ? 'dernier jour' : `${left} j restants`} ·{' '}
            {challenge.participant_count} participant{challenge.participant_count > 1 ? 's' : ''}
          </Text>
        </YStack>
        {challenge.joined ? (
          !isOwner ? (
            <Button
              onPress={() => onLeave(challenge.id)}
              height={32}
              paddingHorizontal="$3"
              borderRadius={999}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="transparent"
              color="$colorSoft"
              fontFamily="$body"
              fontSize={12.5}
              fontWeight="600"
            >
              Quitter
            </Button>
          ) : null
        ) : (
          <Button
            onPress={() => onJoin(challenge.id)}
            height={32}
            paddingHorizontal="$3"
            borderRadius={999}
            backgroundColor="$accent"
            color={palette.paper}
            fontFamily="$body"
            fontSize={12.5}
            fontWeight="700"
          >
            Rejoindre
          </Button>
        )}
      </XStack>

      {isLoading ? (
        <Spinner color="$accent" />
      ) : (
        <YStack gap="$2">
          {(progress ?? []).map((row, i) => {
            const name =
              row.user_id === userId ? 'Toi' : row.display_name || row.pseudo || 'Lecteur';
            const frac = Math.min(1, challenge.target > 0 ? row.value / challenge.target : 0);
            const done = row.value >= challenge.target;
            return (
              <XStack key={row.user_id} alignItems="center" gap="$2.5">
                <Text
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="700"
                  color="$colorMuted"
                  width={16}
                >
                  {i + 1}
                </Text>
                <Avatar path={row.avatar_path} name={name} pseudo={row.pseudo} size={24} />
                <YStack flex={1} gap="$1.5">
                  <Text
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight={row.user_id === userId ? '700' : '600'}
                    color="$color"
                    numberOfLines={1}
                  >
                    {name} {done ? '✓' : ''}
                  </Text>
                  <YStack height={5} borderRadius={999} backgroundColor="$track" overflow="hidden">
                    <YStack
                      height={5}
                      width={`${Math.round(frac * 100)}%`}
                      backgroundColor={done ? palette.forest : '$accent'}
                    />
                  </YStack>
                </YStack>
                <Text
                  fontFamily="$body"
                  fontSize={12}
                  color="$colorSoft"
                  minWidth={64}
                  textAlign="right"
                >
                  {row.value} / {challenge.target}
                </Text>
              </XStack>
            );
          })}
        </YStack>
      )}
    </YStack>
  );
}

export function ChallengesSection({
  circleId,
  userId,
}: {
  circleId: string;
  userId: string | undefined;
}) {
  const { data: challenges, isLoading } = useCircleChallenges(circleId, userId);
  const { create, join, leave } = useChallengeActions(circleId, userId);

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('pages');
  const [target, setTarget] = useState('');
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    const t = title.trim();
    const n = parseInt(target, 10);
    if (!t) return setError('Donne un titre à ton défi.');
    if (!Number.isFinite(n) || n <= 0) return setError('Indique un objectif valide.');
    setError(null);
    const endsOn = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    try {
      await create.mutateAsync({ title: t, goalType, target: n, endsOn });
      setTitle('');
      setTarget('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>
      <YStack gap="$3">
        <Label>Lancer un défi</Label>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Ex. 500 pages cette semaine"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderRadius={12}
          height={44}
        />
        <XStack gap="$2">
          <Pill label="Pages" active={goalType === 'pages'} onPress={() => setGoalType('pages')} />
          <Pill label="Livres" active={goalType === 'books'} onPress={() => setGoalType('books')} />
          <Input
            flex={1}
            value={target}
            onChangeText={setTarget}
            keyboardType="number-pad"
            placeholder={goalType === 'pages' ? 'objectif (pages)' : 'objectif (livres)'}
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderRadius={12}
            height={44}
          />
        </XStack>
        <XStack gap="$2" alignItems="center">
          <Pill label="7 j" active={days === 7} onPress={() => setDays(7)} />
          <Pill label="14 j" active={days === 14} onPress={() => setDays(14)} />
          <Pill label="30 j" active={days === 30} onPress={() => setDays(30)} />
          <Button
            flex={1}
            onPress={onCreate}
            disabled={create.isPending}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={12}
            height={44}
            fontFamily="$body"
            fontWeight="700"
          >
            Créer
          </Button>
        </XStack>
        {error ? (
          <Text fontFamily="$body" fontSize={13} color="$signal">
            {error}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$3">
        <Label>Défis en cours</Label>
        {isLoading ? (
          <Spinner color="$accent" />
        ) : challenges && challenges.length > 0 ? (
          challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              userId={userId}
              onJoin={(id) => join.mutate(id)}
              onLeave={(id) => leave.mutate(id)}
            />
          ))
        ) : (
          <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
            Aucun défi pour le moment. Lance le premier — « 500 pages cette semaine », « un tome par
            jour »… et défie les membres du cercle.
          </Text>
        )}
      </YStack>
    </ScrollView>
  );
}
