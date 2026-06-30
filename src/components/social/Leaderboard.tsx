import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { Avatar } from '@/components/social/Avatar';
import type { LeaderRow } from '@/features/social/use-leaderboard';
import { palette } from '@/theme/tokens';

const MEDAL_COLORS = ['#C9A227', '#9BA0A8', '#B07A48']; // or, argent, bronze

function Row({
  row,
  rank,
  isMe,
  max,
}: {
  row: LeaderRow;
  rank: number;
  isMe: boolean;
  max: number;
}) {
  const router = useRouter();
  const name = isMe ? 'Toi' : row.display_name || row.pseudo || 'Lecteur';
  // No bar at all at 0 pages; a small floor so a tiny score is still visible.
  const frac = row.pages > 0 && max > 0 ? Math.max(0.04, row.pages / max) : 0;
  return (
    <Pressable onPress={isMe ? undefined : () => router.push(`/u/${row.user_id}`)}>
      <XStack
        alignItems="center"
        gap="$2.5"
        paddingVertical="$2"
        paddingHorizontal="$2.5"
        borderRadius={12}
        backgroundColor={isMe ? '$backgroundStrong' : 'transparent'}
      >
        {rank <= 3 ? (
          <YStack width={22} alignItems="center">
            <PackIcon name="medal" size={18} color={MEDAL_COLORS[rank - 1]} />
          </YStack>
        ) : (
          <Text
            fontFamily="$body"
            fontSize={13}
            fontWeight="700"
            color="$colorMuted"
            width={22}
            textAlign="center"
          >
            {rank}
          </Text>
        )}
        <Avatar path={row.avatar_path} name={name} pseudo={row.pseudo} size={28} />
        <YStack flex={1} gap="$1.5">
          <Text
            fontFamily="$body"
            fontSize={13.5}
            fontWeight={isMe ? '700' : '600'}
            color="$color"
            numberOfLines={1}
          >
            {name}
          </Text>
          <YStack height={6} borderRadius={999} backgroundColor="$track" overflow="hidden">
            <YStack
              height={6}
              width={`${Math.round(frac * 100)}%`}
              backgroundColor={isMe ? '$accent' : palette.prussian}
            />
          </YStack>
        </YStack>
        <YStack alignItems="flex-end" minWidth={52}>
          <Text fontFamily="$heading" fontSize={16} fontWeight="600" color="$color">
            {row.pages}
          </Text>
          <Text fontFamily="$body" fontSize={10} color="$colorMuted">
            pages
          </Text>
        </YStack>
      </XStack>
    </Pressable>
  );
}

/** A weekly pages ranking (friends or circle). Renders nothing if there's no one. */
export function Leaderboard({ rows, myId }: { rows: LeaderRow[] | undefined; myId?: string }) {
  if (!rows || rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.pages), 1);
  const anyPages = rows.some((r) => r.pages > 0);

  return (
    <YStack gap="$1" width="100%" maxWidth={600} alignSelf="stretch">
      {rows.map((r, i) => (
        <Row key={r.user_id} row={r} rank={i + 1} isMe={r.user_id === myId} max={max} />
      ))}
      {!anyPages ? (
        <Text
          fontFamily="$body"
          fontSize={12}
          color="$colorMuted"
          lineHeight={18}
          paddingHorizontal="$2.5"
          paddingTop="$1"
        >
          Personne n'a encore lu cette semaine. Lance-toi pour prendre la tête !
        </Text>
      ) : null}
    </YStack>
  );
}
