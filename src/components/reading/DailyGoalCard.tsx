import { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { Card, SectionLabel } from '@/components/ui';
import { useDailyGoal, useSetDailyGoal } from '@/features/reading/use-daily-goal';
import { syncReadingWidget } from '@/features/reading/widget-sync';
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
      <Text fontFamily="$body" fontSize={19} fontWeight="700" color="$color">
        {Math.round(Math.min(1, pct) * 100)}%
      </Text>
    </YStack>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const isoKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
/** Monday-first weekday index: Mon=0 … Sun=6 (JS getDay() is Sun=0). */
const mondayIdx = (d: Date) => (d.getDay() + 6) % 7;
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Shared day-dot style — forest = goal met, brick = partial, empty = 0%, today ringed. */
function dotStyle(pages: number, goal: number, future: boolean, isToday: boolean) {
  const met = goal > 0 && pages >= goal;
  const partial = pages > 0 && !met;
  const filled = met || partial;
  return {
    opacity: future ? 0.35 : 1,
    backgroundColor: met ? palette.forest : partial ? palette.brick : 'transparent',
    borderWidth: isToday ? 2 : filled ? 0 : 1,
    borderColor: isToday ? palette.espresso : future ? '$borderColor' : palette.concrete,
  } as const;
}

function MiniLabel({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={10.5}
      fontWeight="700"
      letterSpacing={1.4}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

/** This week as a horizontal strip — weekday initials over a coloured dot per day. */
function WeekStrip({ byDay, goal }: { byDay: Record<string, number>; goal: number }) {
  const now = new Date();
  const todayKey = isoKey(now);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - mondayIdx(now));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <YStack flex={1} gap="$2">
      <MiniLabel>Cette semaine</MiniLabel>
      <XStack justifyContent="space-between">
        {days.map((d, i) => {
          const key = isoKey(d);
          const future = key > todayKey;
          const s = dotStyle(byDay[key] ?? 0, goal, future, key === todayKey);
          return (
            <YStack key={i} alignItems="center" gap={5}>
              <Text fontFamily="$body" fontSize={10} fontWeight="600" color="$colorMuted">
                {WEEKDAYS[i]}
              </Text>
              <YStack width={16} height={16} borderRadius={999} {...s} />
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}

/**
 * The current month as a calendar grid (7 columns, Monday-first). Day 1 is offset to
 * its weekday — a month starting on a Thursday begins at column 4. Same colour code as
 * the week strip: forest = met, brick = partial, empty = 0%, today ringed, future faded.
 */
function MonthGrid({ byDay, goal }: { byDay: Record<string, number>; goal: number }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = isoKey(now);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = mondayIdx(new Date(year, month, 1)); // blank cells before day 1
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <YStack gap="$2">
      <MiniLabel>{monthLabel}</MiniLabel>
      <YStack gap={4}>
        {weeks.map((week, ri) => (
          <XStack key={ri} gap={4}>
            {week.map((d, ci) => {
              if (d === null) return <YStack key={ci} width={12} height={12} />;
              const key = `${year}-${pad2(month + 1)}-${pad2(d)}`;
              const future = key > todayKey;
              const s = dotStyle(byDay[key] ?? 0, goal, future, key === todayKey);
              return <YStack key={ci} width={12} height={12} borderRadius={999} {...s} />;
            })}
          </XStack>
        ))}
      </YStack>
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

  // Keep the iOS home-screen widget in sync (no-op on web/Android).
  useEffect(() => {
    if (data) syncReadingWidget({ streak: data.streak, today: data.today, goal: data.goal });
  }, [data]);

  if (!data) return null;

  const { goal, today, streak } = data;
  const pct = goal > 0 ? today / goal : 0;
  const met = today >= goal;
  const color = met ? palette.forest : palette.brick;

  return (
    <Card gap="$3" marginTop="$6">
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
            <PackIcon name="flame" size={14} color={palette.brick} />
            <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.brick}>
              {streak} jour{streak > 1 ? 's' : ''}
            </Text>
          </XStack>
        ) : null}
      </XStack>

      <XStack alignItems="center" gap="$4">
        <Ring pct={pct} color={color} />
        <YStack flex={1} gap="$1">
          <XStack alignItems="baseline" gap="$1">
            <Text fontFamily="$body" fontSize={26} fontWeight="800" color="$color">
              {today}
            </Text>
            <Text fontFamily="$body" fontSize={16} fontWeight="600" color="$colorMuted">
              / {goal} pages
            </Text>
          </XStack>
          <Text fontFamily="$body" fontSize={13.5} color="$colorSoft">
            {met
              ? 'Objectif atteint, bravo'
              : `Encore ${goal - today} page${goal - today > 1 ? 's' : ''} aujourd’hui`}
          </Text>
        </YStack>
      </XStack>

      <XStack gap="$4" alignItems="flex-start">
        <WeekStrip byDay={data.byDay} goal={goal} />
        <MonthGrid byDay={data.byDay} goal={goal} />
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
