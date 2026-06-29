import Svg, { Circle } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Card, SectionLabel } from '@/components/ui';
import { useDailyGoal, useSetDailyGoal } from '@/features/reading/use-daily-goal';
import { palette } from '@/theme/tokens';

const PRESETS = [10, 20, 30, 50];

/** A circular progress ring (pages read today / daily goal). */
function Ring({ pct, color, size = 88 }: { pct: number; color: string; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct)));
  const mid = size / 2;
  return (
    <YStack width={size} height={size} alignItems="center" justifyContent="center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={mid} cy={mid} r={r} stroke={palette.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </Svg>
      <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$color">
        {Math.round(Math.min(1, pct) * 100)}%
      </Text>
    </YStack>
  );
}

/**
 * Daily reading goal + streak — the P0 of the engagement roadmap. Shows today's
 * pages vs. the daily target as a ring, the current streak (🔥), and quick presets
 * to set the goal. Kept gentle: no shame, an in-progress day never breaks the streak.
 */
export function DailyGoalCard({ userId }: { userId: string | undefined }) {
  const { data } = useDailyGoal(userId);
  const setGoal = useSetDailyGoal(userId);
  if (!data) return null;

  const { goal, today, streak } = data;
  const pct = goal > 0 ? today / goal : 0;
  const met = today >= goal;
  const color = met ? palette.forest : palette.brick;

  return (
    <Card gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <SectionLabel>Objectif du jour</SectionLabel>
        {streak > 0 ? (
          <XStack
            alignItems="center"
            gap="$1"
            paddingHorizontal="$2"
            height={24}
            borderRadius={999}
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
          >
            <Text fontSize={13}>🔥</Text>
            <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.brick}>
              {streak} jour{streak > 1 ? 's' : ''}
            </Text>
          </XStack>
        ) : null}
      </XStack>

      <XStack alignItems="center" gap="$4">
        <Ring pct={pct} color={color} />
        <YStack flex={1} gap="$1">
          <Text fontFamily="$heading" fontSize={22} fontWeight="600" color="$color">
            {today} / {goal} pages
          </Text>
          <Text fontFamily="$body" fontSize={13.5} color="$colorSoft">
            {met
              ? 'Objectif atteint, bravo 🎉'
              : `Encore ${goal - today} page${goal - today > 1 ? 's' : ''} aujourd’hui`}
          </Text>
        </YStack>
      </XStack>

      <XStack gap="$2" alignItems="center" flexWrap="wrap">
        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
          Cible :
        </Text>
        {PRESETS.map((p) => {
          const active = goal === p;
          return (
            <Button
              key={p}
              onPress={() => setGoal.mutate(p)}
              height={30}
              paddingHorizontal="$3"
              borderRadius={999}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$colorSoft'}
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
            >
              {p} p
            </Button>
          );
        })}
      </XStack>
    </Card>
  );
}
