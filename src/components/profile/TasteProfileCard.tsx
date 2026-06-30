import { useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { ShareProfileSheet } from '@/components/profile/ShareProfileSheet';
import { Card, SectionLabel } from '@/components/ui';
import { useTranches } from '@/components/ui/BarList';
import { useReaderTaste } from '@/features/library/use-reader-taste';

/** "Profil de lecture" — the reader's semantic universes (from reader-taste) as
 *  stacked tranche-coloured bars (book-spine style, like the logo), each = a %.
 *  Hidden until the profile has been computed. */
export function TasteProfileCard({ userId }: { userId: string | undefined }) {
  const tranches = useTranches();
  const { data } = useReaderTaste(userId);
  const [shareOpen, setShareOpen] = useState(false);
  const clusters = (data?.clusters ?? [])
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent);
  if (clusters.length === 0) return null;

  return (
    <Card gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <SectionLabel>Profil de lecture</SectionLabel>
        <Text
          onPress={() => setShareOpen(true)}
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          color="$accent"
          pressStyle={{ opacity: 0.6 }}
        >
          Partager
        </Text>
      </XStack>
      {shareOpen ? (
        <ShareProfileSheet
          userId={userId}
          data={{ clusters }}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
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
