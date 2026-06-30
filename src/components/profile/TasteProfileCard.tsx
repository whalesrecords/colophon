import { Text, XStack, YStack } from 'tamagui';

import { Card, SectionLabel } from '@/components/ui';
import { useTranches } from '@/components/ui/BarList';
import { useReaderTaste } from '@/features/library/use-reader-taste';

/** "Profil de lecture" — the reader's semantic universes (from reader-taste) as
 *  stacked tranche-coloured bars (book-spine style, like the logo), each = a %.
 *  Hidden until the profile has been computed. */
export function TasteProfileCard({ userId }: { userId: string | undefined }) {
  const tranches = useTranches();
  const { data } = useReaderTaste(userId);
  const clusters = (data?.clusters ?? [])
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent);
  if (clusters.length === 0) return null;

  return (
    <Card gap="$3">
      <SectionLabel>Profil de lecture</SectionLabel>
      <YStack gap={14}>
        {clusters.map((c, i) => {
          const color = tranches[i % tranches.length];
          return (
            <YStack key={c.label} gap={7}>
              <XStack alignItems="baseline" gap="$2">
                <Text fontFamily="$body" fontSize={14} color="$color" flex={1} numberOfLines={1}>
                  {c.label}
                </Text>
                <Text fontFamily="$heading" fontSize={16} fontWeight="600" color={color}>
                  {Math.round(c.percent)}%
                </Text>
              </XStack>
              {/* Book-spine bar: slightly squared corners, like the logo's slices. */}
              <YStack height={11} borderRadius={3} backgroundColor="$track" overflow="hidden">
                <YStack
                  height={11}
                  width={`${Math.min(100, Math.max(0, c.percent))}%`}
                  borderRadius={3}
                  backgroundColor={color}
                />
              </YStack>
            </YStack>
          );
        })}
      </YStack>
    </Card>
  );
}
