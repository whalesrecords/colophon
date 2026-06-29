import { useEffect, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import type { LibraryItem } from '@/features/library/use-library';
import { useMarkSeriesRead } from '@/features/reading/use-reading-sessions';
import { palette } from '@/theme/tokens';

/**
 * In the series overlay: mark the whole series — or just its first N volumes —
 * as read in one tap. `items` are the owned volumes, sorted by volume ascending.
 */
export function SeriesMarkRead({
  items,
  userId,
}: {
  items: LibraryItem[];
  userId: string | undefined;
}) {
  const mark = useMarkSeriesRead(userId);
  const total = items.length;
  const alreadyRead = items.filter((i) => i.status === 'read').length;
  const [count, setCount] = useState(total);
  const [done, setDone] = useState(false);

  // Reset when the open series changes.
  useEffect(() => {
    setCount(total);
    setDone(false);
  }, [total, items]);

  if (total === 0) return null;

  const onMark = () => {
    const ids = items.slice(0, count).map((i) => i.id);
    mark.mutate(ids, { onSuccess: () => setDone(true) });
  };

  const plural = count > 1 ? 's' : '';

  return (
    <YStack
      gap="$2.5"
      padding="$3"
      borderRadius={14}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$backgroundStrong"
    >
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="600"
        letterSpacing={2}
        textTransform="uppercase"
        color="$colorMuted"
      >
        Marquer comme lu
      </Text>
      {alreadyRead > 0 ? (
        <Text fontFamily="$body" fontSize={13} color="$colorSoft">
          {alreadyRead}/{total} déjà lus
        </Text>
      ) : null}

      <XStack alignItems="center" gap="$2">
        <Button
          onPress={() => {
            setCount((c) => Math.max(1, c - 1));
            setDone(false);
          }}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={10}
          height={40}
          width={44}
          fontFamily="$body"
          fontSize={20}
        >
          −
        </Button>
        <YStack
          minWidth={96}
          height={40}
          alignItems="center"
          justifyContent="center"
          borderRadius={10}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
        >
          <Text fontFamily="$heading" fontSize={16} color="$color">
            {count} tome{plural}
          </Text>
        </YStack>
        <Button
          onPress={() => {
            setCount((c) => Math.min(total, c + 1));
            setDone(false);
          }}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={10}
          height={40}
          width={44}
          fontFamily="$body"
          fontSize={18}
        >
          +
        </Button>
        <Button
          onPress={() => {
            setCount(total);
            setDone(false);
          }}
          chromeless
          height={40}
          paddingHorizontal="$2"
          color="$colorMuted"
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
        >
          Toute la série
        </Button>
      </XStack>

      <Button
        onPress={onMark}
        disabled={mark.isPending || done}
        backgroundColor={done ? palette.forest : '$accent'}
        color={palette.paper}
        borderRadius={12}
        height={46}
        fontFamily="$body"
        fontWeight="600"
        fontSize={15}
        opacity={mark.isPending ? 0.7 : 1}
      >
        {done
          ? `✓ ${count} tome${plural} marqué${plural} lu${plural}`
          : `Marquer ${count} tome${plural} comme lu${plural}`}
      </Button>
    </YStack>
  );
}
