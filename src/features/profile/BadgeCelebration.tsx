import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import type { Badge } from '@/features/profile/badges';
import { palette } from '@/theme/tokens';

const SEEN_KEY = 'colophon.badgesSeen.v1';

/**
 * Queues a celebration pop-up for each newly-earned badge. On the very first run we
 * baseline the already-earned badges silently (no party for things you earned before
 * we started tracking) — only badges crossed *after* that get celebrated.
 */
export function useBadgeCelebration(badges: Badge[]) {
  const [queue, setQueue] = useState<Badge[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const earnedKey = badges
    .filter((b) => b.earned)
    .map((b) => b.id)
    .join(',');

  useEffect(() => {
    let alive = true;
    const earned = badges.filter((b) => b.earned);
    (async () => {
      if (seen.current === null) {
        const raw = await AsyncStorage.getItem(SEEN_KEY).catch(() => null);
        if (!alive) return;
        if (raw === null) {
          // First ever load: record the baseline, celebrate nothing.
          seen.current = new Set(earned.map((b) => b.id));
          AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen.current])).catch(() => {});
          return;
        }
        seen.current = new Set(JSON.parse(raw) as string[]);
      }
      const known = seen.current;
      const fresh = earned.filter((b) => !known.has(b.id));
      if (fresh.length) {
        fresh.forEach((b) => known.add(b.id));
        AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...known])).catch(() => {});
        setQueue((q) => [...q, ...fresh]);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey]);

  return {
    current: queue[0] ?? null,
    dismiss: () => setQueue((q) => q.slice(1)),
  };
}

/** Celebratory pop-up shown the moment a badge is unlocked. */
export function BadgeCelebration({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <YStack
          flex={1}
          backgroundColor="rgba(26,20,14,0.92)"
          alignItems="center"
          justifyContent="center"
          padding="$5"
        >
          <YStack
            width="100%"
            maxWidth={360}
            backgroundColor={palette.paper}
            borderRadius={22}
            padding="$6"
            gap="$3"
            alignItems="center"
          >
            <Text
              fontFamily="$body"
              fontSize={11}
              fontWeight="700"
              letterSpacing={2}
              textTransform="uppercase"
              color={palette.gold}
            >
              Badge débloqué
            </Text>
            <YStack
              width={88}
              height={88}
              borderRadius={999}
              alignItems="center"
              justifyContent="center"
              backgroundColor={palette.surfaceWarmAlt}
              borderWidth={3}
              borderColor={palette.gold}
            >
              <PackIcon name={badge.icon} size={42} color={palette.espresso} />
            </YStack>
            <Text
              fontFamily="$heading"
              fontSize={22}
              fontWeight="600"
              color={palette.ink}
              textAlign="center"
            >
              {badge.label}
            </Text>
            <Text
              fontFamily="$body"
              fontSize={14}
              color={palette.inkSoft}
              textAlign="center"
              lineHeight={20}
            >
              {badge.desc}
            </Text>
            <Button
              onPress={onClose}
              marginTop="$2"
              width="100%"
              height={50}
              borderRadius={12}
              backgroundColor={palette.espresso}
              color={palette.paper}
              fontFamily="$body"
              fontWeight="700"
              pressStyle={{ opacity: 0.88 }}
            >
              Génial
            </Button>
          </YStack>
        </YStack>
      </Pressable>
    </Modal>
  );
}
