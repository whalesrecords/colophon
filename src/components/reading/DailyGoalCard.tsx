import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Icon, PackIcon } from '@/components/icons';
import { Card, SectionLabel } from '@/components/ui';
import { useDailyGoal, useSetDailyGoal } from '@/features/reading/use-daily-goal';
import { syncReadingWidget } from '@/features/reading/widget-sync';
import { palette } from '@/theme/tokens';

const PRESETS = [10, 20, 30, 50];

/** A hairline divider between the card's four sections (theme-aware). */
function Filet({ my = 18 }: { my?: number }) {
  return <YStack height={1} backgroundColor="$borderColor" marginVertical={my} />;
}

/** Section subtitle — full ink/parchment (theme-aware), the handoff's readability fix. */
function MiniLabel({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.4}
      textTransform="uppercase"
      color="$color"
    >
      {children}
    </Text>
  );
}

/** The big hero progress ring (% read today / goal). */
function Ring({ pct, color, size }: { pct: number; color: string; size: number }) {
  const stroke = 11;
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
      <Text
        fontFamily="$heading"
        fontSize={Math.round(size * 0.23)}
        lineHeight={Math.round(size * 0.32)}
        fontWeight="600"
        color="$color"
      >
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

/** Shared day-dot style — forest = goal met, brick = partial, empty = 0%; today ringed,
 *  future days dotted (theme-aware borders so it reads in dark mode too). */
function dotStyle(pages: number, goal: number, future: boolean, isToday: boolean) {
  const met = goal > 0 && pages >= goal;
  const partial = pages > 0 && !met;
  const filled = met || partial;
  return {
    backgroundColor: met ? palette.forest : partial ? palette.brick : 'transparent',
    borderWidth: isToday ? 2.5 : 1,
    borderStyle: (future && !filled ? 'dotted' : 'solid') as 'dotted' | 'solid',
    borderColor: isToday ? '$color' : filled ? 'transparent' : '$borderColor',
  } as const;
}

/** This week as a horizontal strip + a legend of validated days. */
function WeekStrip({
  byDay,
  goal,
  dot,
}: {
  byDay: Record<string, number>;
  goal: number;
  dot: number;
}) {
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
  const validated = days.filter((d) => {
    const k = isoKey(d);
    return k <= todayKey && goal > 0 && (byDay[k] ?? 0) >= goal;
  }).length;

  return (
    <YStack flex={1} gap="$2">
      <MiniLabel>Cette semaine</MiniLabel>
      <XStack justifyContent="space-between">
        {days.map((d, i) => {
          const key = isoKey(d);
          const future = key > todayKey;
          const met = goal > 0 && (byDay[key] ?? 0) >= goal;
          const s = dotStyle(byDay[key] ?? 0, goal, future, key === todayKey);
          return (
            <YStack key={i} alignItems="center" gap={5}>
              <Text fontFamily="$body" fontSize={11} fontWeight="600" color="$colorMuted">
                {WEEKDAYS[i]}
              </Text>
              {/* ✓ on met days so status isn't carried by colour alone (WCAG 1.4.1). */}
              <YStack
                width={dot}
                height={dot}
                borderRadius={999}
                alignItems="center"
                justifyContent="center"
                {...s}
              >
                {met ? (
                  <Icon name="check" size={Math.round(dot * 0.6)} color={palette.paper} />
                ) : null}
              </YStack>
            </YStack>
          );
        })}
      </XStack>
      <Text fontFamily="$body" fontSize={12.5} color="$colorSoft" lineHeight={17}>
        {validated === 0
          ? 'Aucun jour validé cette semaine.'
          : `${validated} jour${validated > 1 ? 's' : ''} validé${validated > 1 ? 's' : ''} cette semaine.`}
      </Text>
    </YStack>
  );
}

/** Current month as a 7-column grid (Monday-first); day 1 offset to its weekday. */
function MonthGrid({
  byDay,
  goal,
  dot,
}: {
  byDay: Record<string, number>;
  goal: number;
  dot: number;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = isoKey(now);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = mondayIdx(new Date(year, month, 1));
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long' });
  const gap = Math.round(dot * 0.32);

  return (
    <YStack gap="$2">
      <MiniLabel>{monthLabel}</MiniLabel>
      <YStack gap={gap}>
        {weeks.map((week, ri) => (
          <XStack key={ri} gap={gap}>
            {week.map((d, ci) => {
              if (d === null) return <YStack key={ci} width={dot} height={dot} />;
              const key = `${year}-${pad2(month + 1)}-${pad2(d)}`;
              const future = key > todayKey;
              const s = dotStyle(byDay[key] ?? 0, goal, future, key === todayKey);
              return <YStack key={ci} width={dot} height={dot} borderRadius={999} {...s} />;
            })}
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** A small month ring whose fill = share of the month's days that met the goal. */
function MonthRing({
  ratio,
  current,
  future,
  size,
  todayRing,
}: {
  ratio: number;
  current: boolean;
  future: boolean;
  size: number;
  todayRing: string;
}) {
  const stroke = 3.4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, ratio)));
  const mid = size / 2;
  return (
    <YStack opacity={future ? 0.4 : 1}>
      <Svg width={size} height={size}>
        <Circle cx={mid} cy={mid} r={r} stroke={palette.track} strokeWidth={stroke} fill="none" />
        {ratio > 0 ? (
          <Circle
            cx={mid}
            cy={mid}
            r={r}
            stroke={palette.forest}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={off}
            strokeLinecap="round"
            transform={`rotate(-90 ${mid} ${mid})`}
          />
        ) : null}
        {current ? (
          <Circle
            cx={mid}
            cy={mid}
            r={r + stroke - 0.5}
            stroke={todayRing}
            strokeWidth={1}
            fill="none"
          />
        ) : null}
      </Svg>
    </YStack>
  );
}

/** The year as 12 rings — one per month, filled by how many days met the goal. */
function YearRings({
  byDay,
  goal,
  ring,
  todayRing,
}: {
  byDay: Record<string, number>;
  goal: number;
  ring: number;
  todayRing: string;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const curMonth = now.getMonth();
  const months = Array.from({ length: 12 }, (_, m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    let met = 0;
    if (goal > 0) {
      for (let d = 1; d <= daysInMonth; d++) {
        if ((byDay[`${year}-${pad2(m + 1)}-${pad2(d)}`] ?? 0) >= goal) met += 1;
      }
    }
    return { m, ratio: daysInMonth > 0 ? met / daysInMonth : 0 };
  });
  return (
    <YStack gap="$2">
      <MiniLabel>{`Cette année · ${year}`}</MiniLabel>
      <XStack justifyContent="space-between">
        {months.map((mo) => (
          <YStack key={mo.m} alignItems="center" gap={4}>
            <MonthRing
              ratio={mo.ratio}
              current={mo.m === curMonth}
              future={mo.m > curMonth}
              size={ring}
              todayRing={todayRing}
            />
            <Text
              fontFamily="$body"
              fontSize={9.5}
              fontWeight={mo.m === curMonth ? '800' : '600'}
              color={mo.m === curMonth ? '$color' : '$colorMuted'}
            >
              {MONTH_INITIALS[mo.m]}
            </Text>
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
}

/**
 * Daily reading goal + streak (engagement P0), redesigned per the gamification handoff:
 * a clear progression hero, then three rhythms (week · month · year) separated by
 * hairlines, then the target chips. Data layer unchanged (`useDailyGoal`); colours are
 * theme-aware so it reads in both the parchemin and sumi-ink themes.
 */
export function DailyGoalCard({ userId }: { userId: string | undefined }) {
  const { data } = useDailyGoal(userId);
  const setGoal = useSetDailyGoal(userId);
  const { width } = useWindowDimensions();
  const big = width >= 640;

  // Keep the iOS home-screen widget in sync (no-op on web/Android).
  useEffect(() => {
    if (data) syncReadingWidget({ streak: data.streak, today: data.today, goal: data.goal });
  }, [data]);

  if (!data) return null;

  const { goal, today, streak } = data;
  const pct = goal > 0 ? today / goal : 0;
  const met = today >= goal;
  const color = met ? palette.forest : palette.brick;
  const remaining = Math.max(0, goal - today);
  const dateLabel = new Date()
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
    .replace('.', '');

  return (
    <Card gap="$0" marginTop="$6">
      {/* 1 — Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <SectionLabel>Objectif du jour</SectionLabel>
        {streak > 0 ? (
          <XStack
            alignItems="center"
            gap="$1"
            paddingHorizontal={10}
            height={26}
            borderRadius={999}
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
          >
            <PackIcon name="flame" size={14} color={palette.brick} />
            <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$color">
              {streak} jour{streak > 1 ? 's' : ''}
            </Text>
          </XStack>
        ) : null}
      </XStack>

      {/* 2 — Progression hero */}
      <XStack alignItems="center" gap="$5" marginTop="$4">
        <Ring pct={pct} color={color} size={big ? 132 : 108} />
        <YStack flex={1} gap="$1">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1.2}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Aujourd’hui · {dateLabel}
          </Text>
          <XStack alignItems="baseline" gap="$2">
            <Text
              fontFamily="$heading"
              fontSize={big ? 56 : 44}
              lineHeight={big ? 76 : 60}
              fontWeight="600"
              color="$color"
            >
              {today}
            </Text>
            <Text
              fontFamily="$heading"
              fontSize={big ? 22 : 19}
              lineHeight={big ? 30 : 26}
              color="$colorMuted"
            >
              / {goal} pages
            </Text>
          </XStack>
          <XStack alignItems="center" gap={6} marginTop="$1">
            {met ? <Icon name="check" size={17} color={palette.forest} /> : null}
            <Text
              fontFamily="$body"
              fontSize={14.5}
              fontWeight={met ? '600' : '400'}
              color={met ? palette.forest : '$colorSoft'}
            >
              {met
                ? 'Objectif atteint, bravo.'
                : `Encore ${remaining} page${remaining > 1 ? 's' : ''} aujourd’hui`}
            </Text>
          </XStack>
        </YStack>
      </XStack>

      <Filet my={big ? 24 : 18} />

      {/* 3 — Cette semaine + mois (côte à côte) */}
      <XStack gap="$5" alignItems="flex-start">
        <WeekStrip byDay={data.byDay} goal={goal} dot={big ? 28 : 22} />
        <MonthGrid byDay={data.byDay} goal={goal} dot={big ? 18 : 13} />
      </XStack>

      <Filet my={big ? 24 : 18} />

      {/* 4 — Cette année */}
      <YearRings byDay={data.byDay} goal={goal} ring={big ? 34 : 26} todayRing={palette.forest} />

      <Filet my={big ? 24 : 18} />

      {/* 5 — Cible quotidienne */}
      <YStack gap="$2">
        <MiniLabel>Cible quotidienne</MiniLabel>
        <XStack gap="$2" flexWrap="wrap">
          {PRESETS.map((p) => {
            const active = goal === p;
            return (
              <Button
                key={p}
                onPress={() => setGoal.mutate(p)}
                height={40}
                paddingHorizontal="$4"
                gap="$1.5"
                borderRadius={999}
                borderWidth={1}
                borderColor={active ? '$accent' : '$borderColor'}
                backgroundColor={active ? '$accent' : '$background'}
                pressStyle={{ opacity: 0.85 }}
              >
                <Text
                  fontFamily="$heading"
                  fontSize={17}
                  lineHeight={22}
                  fontWeight="600"
                  color={active ? palette.paper : '$color'}
                >
                  {p}
                </Text>
                <Text
                  fontFamily="$body"
                  fontSize={12}
                  color={active ? palette.paper : '$colorMuted'}
                >
                  pages
                </Text>
              </Button>
            );
          })}
        </XStack>
      </YStack>
    </Card>
  );
}
