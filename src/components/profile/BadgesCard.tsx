import { useEffect } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { Card, SectionLabel } from '@/components/ui';
import { BadgeCelebration, useBadgeCelebration } from '@/features/profile/BadgeCelebration';
import { type Badge, computeBadges } from '@/features/profile/badges';
import { useDailyGoal } from '@/features/reading/use-daily-goal';
import { syncBadgesWidget } from '@/features/reading/widget-sync';
import { palette } from '@/theme/tokens';

interface StatsForBadges {
  total: number;
  readThisYear: number;
  pagesRead: number;
  authors: number;
  read: number;
  reviews: number;
}

function BadgeTile({ badge }: { badge: Badge }) {
  return (
    // Uniform height (label reserves 2 lines, progress reserves its row) so every
    // tile is the same size — a clean grid instead of rows of mismatched heights.
    <YStack width={72} alignItems="center" gap="$2" opacity={badge.earned ? 1 : 0.55}>
      <YStack
        width={56}
        height={56}
        borderRadius={999}
        alignItems="center"
        justifyContent="center"
        backgroundColor={badge.earned ? palette.surfaceWarmAlt : '$background'}
        borderColor={badge.earned ? palette.gold : '$borderColor'}
        borderWidth={badge.earned ? 2 : 1}
      >
        <PackIcon
          name={badge.icon}
          size={28}
          color={badge.earned ? palette.espresso : palette.concrete}
        />
      </YStack>
      <YStack height={30} justifyContent="flex-start">
        <Text
          fontFamily="$body"
          fontSize={10.5}
          lineHeight={14}
          fontWeight="600"
          color="$color"
          textAlign="center"
          numberOfLines={2}
        >
          {badge.label}
        </Text>
      </YStack>
      <YStack height={4} justifyContent="center">
        {!badge.earned && badge.progress > 0 ? (
          <YStack
            width={40}
            height={3}
            borderRadius={999}
            backgroundColor="$track"
            overflow="hidden"
          >
            <YStack
              height={3}
              width={`${Math.round(badge.progress * 100)}%`}
              backgroundColor={palette.concrete}
            />
          </YStack>
        ) : null}
      </YStack>
    </YStack>
  );
}

/** Earned + locked reading badges, computed from the user's stats + streak. */
export function BadgesCard({
  userId,
  stats,
}: {
  userId: string | undefined;
  stats: StatsForBadges;
}) {
  const { data: goal } = useDailyGoal(userId);
  const badges = computeBadges({ ...stats, streak: goal?.streak ?? 0 });
  const earnedBadges = badges.filter((b) => b.earned);
  const earned = earnedBadges.length;
  const { current, dismiss } = useBadgeCelebration(badges);

  // Keep the iOS badges widget in sync (no-op on web/Android).
  useEffect(() => {
    syncBadgesWidget({
      earned,
      total: badges.length,
      labels: earnedBadges.map((b) => b.label),
      icons: earnedBadges.map((b) => b.icon),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earned, badges.length]);

  return (
    <Card gap="$3" marginTop="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <SectionLabel>Badges</SectionLabel>
        <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$gold">
          {earned}/{badges.length}
        </Text>
      </XStack>
      <XStack flexWrap="wrap" rowGap="$5" columnGap="$3" justifyContent="space-between">
        {badges.map((b) => (
          <BadgeTile key={b.id} badge={b} />
        ))}
      </XStack>
      {current ? <BadgeCelebration badge={current} onClose={dismiss} /> : null}
    </Card>
  );
}
