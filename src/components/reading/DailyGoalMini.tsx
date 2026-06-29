import { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Text, XStack, YStack } from 'tamagui';

import { useDailyGoal } from '@/features/reading/use-daily-goal';
import { syncReadingWidget } from '@/features/reading/widget-sync';
import { palette } from '@/theme/tokens';

/** Compact daily-goal ring + streak for the home header — taps through to Profil. */
export function DailyGoalMini({ userId, onPress }: { userId?: string; onPress?: () => void }) {
  const { data } = useDailyGoal(userId);

  // Home is the most-opened screen — keep the iOS widget fresh from here too (no-op
  // on web/Android).
  useEffect(() => {
    if (data) syncReadingWidget({ streak: data.streak, today: data.today, goal: data.goal });
  }, [data]);

  if (!data) return null;
  const { today, goal, streak } = data;
  const pct = goal > 0 ? Math.min(1, today / goal) : 0;
  const met = today >= goal;
  const color = met ? palette.forest : palette.brick;
  const size = 44;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  const mid = size / 2;

  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$2.5"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={999}
      paddingLeft={6}
      paddingRight={16}
      height={56}
      pressStyle={{ opacity: 0.7 }}
      hoverStyle={{ borderColor: '$accent' }}
      {...({ style: { cursor: 'pointer' } } as object)}
    >
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
        <Text fontSize={14}>{streak > 0 ? '🔥' : '📖'}</Text>
      </YStack>
      <YStack>
        <Text fontFamily="$heading" fontSize={16} fontWeight="600" color="$color">
          {today} / {goal} p.
        </Text>
        <Text fontFamily="$body" fontSize={11.5} color="$colorMuted">
          {streak > 0 ? `Série · ${streak} jour${streak > 1 ? 's' : ''}` : 'Objectif du jour'}
        </Text>
      </YStack>
    </XStack>
  );
}
