import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { type LibraryItem, useLibrary } from '@/features/library/use-library';
import {
  useCurrentlyReading,
  useReadingSessions,
  useSessionActions,
} from '@/features/reading/use-reading-sessions';
import { palette } from '@/theme/tokens';

const NUIT = palette.nuit;
const PAPER = palette.paper;

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** A distraction-free, dark "reading sitting": cover + a calm chrono, then mark the page. */
export default function ReadingSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { item: itemParam } = useLocalSearchParams<{ item?: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: items } = useLibrary(userId);
  const { data: current } = useCurrentlyReading(userId);
  const reading = (items ?? []).filter((i) => i.status === 'reading');

  const [picked, setPicked] = useState<string | undefined>(itemParam);
  const activeId =
    picked ?? (current && !current.justFinished ? current.itemId : undefined) ?? reading[0]?.id;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <YStack flex={1} backgroundColor={NUIT} paddingTop={insets.top + 8}>
      <XStack paddingHorizontal="$4" alignItems="center" justifyContent="space-between" height={44}>
        <Pressable onPress={close} accessibilityRole="button" hitSlop={10}>
          <Icon name="chevronLeft" size={26} color={palette.concreteLighter} />
        </Pressable>
        <Text
          fontFamily="$body"
          fontSize={11}
          fontWeight="700"
          letterSpacing={2.4}
          textTransform="uppercase"
          color={palette.concrete}
        >
          Séance de lecture
        </Text>
        <YStack width={26} />
      </XStack>

      {activeId ? (
        <Session
          key={activeId}
          itemId={activeId}
          userId={userId}
          item={(items ?? []).find((i) => i.id === activeId)}
          onClose={close}
        />
      ) : (
        <Picker reading={reading} onPick={setPicked} />
      )}
    </YStack>
  );
}

function Picker({ reading, onPick }: { reading: LibraryItem[]; onPick: (id: string) => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text fontFamily="$heading" fontSize={24} fontWeight="500" color={PAPER} marginBottom="$2">
        Quel livre ce soir ?
      </Text>
      <Text fontFamily="$body" fontSize={14} color={palette.concreteLighter} marginBottom="$4">
        Choisis une lecture en cours pour démarrer ta séance.
      </Text>
      {reading.length === 0 ? (
        <Text fontFamily="$body" fontSize={14} color={palette.concrete}>
          Aucune lecture en cours. Ouvre un livre et appuie sur « Commencer la lecture ».
        </Text>
      ) : (
        <YStack gap="$3">
          {reading.map((it) => (
            <Pressable key={it.id} onPress={() => onPick(it.id)}>
              <XStack gap="$3" alignItems="center">
                <BookCover
                  title={it.book?.title ?? ''}
                  coverUrl={it.coverOverride ?? it.book?.cover_url}
                  isbn={it.book?.isbn13}
                  width={48}
                />
                <YStack flex={1}>
                  <Text fontFamily="$heading" fontSize={16} color={PAPER} numberOfLines={2}>
                    {it.book?.title ?? 'Sans titre'}
                  </Text>
                  {it.book?.authors?.[0] ? (
                    <Text fontFamily="$body" fontSize={12.5} color={palette.concrete}>
                      {it.book.authors[0]}
                    </Text>
                  ) : null}
                </YStack>
                <Icon name="chevronLeft" size={20} color={palette.concrete} />
              </XStack>
            </Pressable>
          ))}
        </YStack>
      )}
    </ScrollView>
  );
}

function Session({
  itemId,
  userId,
  item,
  onClose,
}: {
  itemId: string;
  userId: string | undefined;
  item: LibraryItem | undefined;
  onClose: () => void;
}) {
  const { data: sessions } = useReadingSessions(itemId);
  const { start, setPage, logMinutes } = useSessionActions(itemId, userId);
  const open = sessions?.find((s) => s.status === 'reading');

  // Chrono (timestamp-based so it survives the screen sleeping).
  const [running, setRunning] = useState(false);
  const [baseSeconds, setBaseSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const elapsed =
    running && startedAt != null
      ? baseSeconds + Math.floor((Date.now() - startedAt) / 1000)
      : baseSeconds;
  const credit = Math.round(elapsed / 60);

  // 'pages' = the post-session "où en es-tu ?" step.
  const [phase, setPhase] = useState<'timing' | 'pages'>('timing');
  const [page, setLocalPage] = useState<string>('');
  useEffect(() => {
    if (open) setLocalPage(String(open.current_page ?? 0));
  }, [open?.id]);

  const title = item?.book?.title ?? null;
  const total = open?.total_pages ?? 0;

  const startOrResume = () => {
    setStartedAt(Date.now());
    setRunning(true);
  };
  const pause = () => {
    setBaseSeconds(elapsed);
    setStartedAt(null);
    setRunning(false);
  };
  const finishSitting = () => {
    if (credit >= 1) logMinutes.mutate({ sessionId: open!.id, minutes: credit });
    setRunning(false);
    setStartedAt(null);
    setBaseSeconds(0);
    setPhase('pages');
  };
  const savePage = () => {
    const n = parseInt(page, 10);
    if (open && Number.isFinite(n)) setPage.mutate({ sessionId: open.id, page: Math.max(0, n) });
    onClose();
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
        <YStack alignItems="center" gap="$3">
          <BookCover
            title={item?.book?.title ?? ''}
            coverUrl={item?.coverOverride ?? item?.book?.cover_url}
            isbn={item?.book?.isbn13}
            width={132}
          />
          <YStack alignItems="center" gap="$1" maxWidth={300}>
            <Text
              fontFamily="$heading"
              fontSize={22}
              fontWeight="500"
              color={PAPER}
              textAlign="center"
              numberOfLines={2}
            >
              {title ?? 'Sans titre'}
            </Text>
            {item?.book?.authors?.[0] ? (
              <Text
                fontFamily="$heading"
                fontSize={14}
                fontStyle="italic"
                color={palette.concreteLighter}
              >
                {item.book.authors[0]}
              </Text>
            ) : null}
          </YStack>
        </YStack>

        {!open ? (
          <YStack gap="$3" alignItems="center">
            <Text fontFamily="$body" fontSize={14} color={palette.concreteLighter}>
              Prêt·e à lire ?
            </Text>
            <Button
              onPress={() => start.mutate(null)}
              backgroundColor={palette.brick}
              color={PAPER}
              borderRadius={14}
              height={52}
              paddingHorizontal="$6"
              fontFamily="$body"
              fontWeight="700"
              fontSize={16}
            >
              Commencer la lecture
            </Button>
          </YStack>
        ) : phase === 'timing' ? (
          <YStack gap="$5" alignItems="center" width="100%">
            <Text
              fontFamily="$heading"
              fontSize={68}
              fontWeight="500"
              color={running ? palette.goldDark : PAPER}
              fontVariant={['tabular-nums']}
            >
              {fmtClock(elapsed)}
            </Text>

            {!running && elapsed === 0 ? (
              <Button
                onPress={startOrResume}
                backgroundColor={palette.brick}
                color={PAPER}
                borderRadius={14}
                height={54}
                paddingHorizontal="$7"
                fontFamily="$body"
                fontWeight="700"
                fontSize={16.5}
                pressStyle={{ opacity: 0.9 }}
              >
                Démarrer
              </Button>
            ) : (
              <YStack gap="$3" alignItems="center" width="100%" maxWidth={320}>
                <Button
                  onPress={running ? pause : startOrResume}
                  backgroundColor="transparent"
                  borderColor={palette.concrete}
                  borderWidth={1}
                  color={PAPER}
                  borderRadius={14}
                  height={50}
                  width="100%"
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={15.5}
                >
                  {running ? 'Pause' : 'Reprendre'}
                </Button>
                <Button
                  onPress={finishSitting}
                  backgroundColor={palette.brick}
                  color={PAPER}
                  borderRadius={14}
                  height={50}
                  width="100%"
                  fontFamily="$body"
                  fontWeight="700"
                  fontSize={15.5}
                  pressStyle={{ opacity: 0.9 }}
                >
                  {credit >= 1 ? `Terminer la séance · +${credit} min` : 'Terminer la séance'}
                </Button>
              </YStack>
            )}
          </YStack>
        ) : (
          <YStack gap="$4" alignItems="center" width="100%" maxWidth={320}>
            <Text fontFamily="$heading" fontSize={22} color={PAPER} textAlign="center">
              Où en es-tu ?
            </Text>
            <XStack gap="$2" alignItems="center" width="100%">
              <Button
                onPress={() => setLocalPage(String(Math.max(0, (parseInt(page, 10) || 0) - 10)))}
                backgroundColor="transparent"
                borderColor={palette.concrete}
                borderWidth={1}
                color={PAPER}
                borderRadius={12}
                height={52}
                width={56}
                fontFamily="$body"
                fontSize={20}
              >
                −
              </Button>
              <Input
                flex={1}
                value={page}
                onChangeText={setLocalPage}
                keyboardType="number-pad"
                textAlign="center"
                backgroundColor={palette.espressoDeep}
                borderColor={palette.concrete}
                borderWidth={1}
                borderRadius={12}
                height={52}
                fontFamily="$heading"
                fontSize={22}
                color={PAPER}
              />
              <Button
                onPress={() => setLocalPage(String((parseInt(page, 10) || 0) + 10))}
                backgroundColor="transparent"
                borderColor={palette.concrete}
                borderWidth={1}
                color={PAPER}
                borderRadius={12}
                height={52}
                width={56}
                fontFamily="$body"
                fontSize={20}
              >
                +
              </Button>
            </XStack>
            {total > 0 ? (
              <Text fontFamily="$body" fontSize={13} color={palette.concrete}>
                sur {total} pages
              </Text>
            ) : null}
            <Button
              onPress={savePage}
              backgroundColor={palette.forest}
              color={PAPER}
              borderRadius={14}
              height={52}
              width="100%"
              fontFamily="$body"
              fontWeight="700"
              fontSize={16}
              pressStyle={{ opacity: 0.9 }}
            >
              Enregistrer
            </Button>
            <Pressable onPress={onClose}>
              <Text fontFamily="$body" fontSize={14} color={palette.concrete}>
                Plus tard
              </Text>
            </Pressable>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}
