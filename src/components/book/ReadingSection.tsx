import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import {
  type ReadingSession,
  useReadingSessions,
  useSessionActions,
} from '@/features/reading/use-reading-sessions';
import { parseFlexibleDate } from '@/lib/reading-date';
import { palette } from '@/theme/tokens';

const SESSION_STATUS: Record<string, string> = {
  reading: 'En cours',
  finished: 'Terminé',
  abandoned: 'Abandonné',
};

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={2}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

interface ReadingSectionProps {
  itemId: string;
  userId: string | undefined;
  totalPages: number | null;
}

export function ReadingSection({ itemId, userId, totalPages }: ReadingSectionProps) {
  const router = useRouter();
  const { data: sessions } = useReadingSessions(itemId);
  const { start, setPage, finish, remove, updateDates, logMinutes } = useSessionActions(
    itemId,
    userId,
  );
  const open = sessions?.find((s) => s.status === 'reading');

  return (
    <YStack gap="$3">
      <Label>Suivi de lecture</Label>

      {open ? (
        <YStack gap="$4">
          <Progress
            session={open}
            onSetPage={(page) => setPage.mutate({ sessionId: open.id, page })}
            onFinish={() => finish.mutate(open.id)}
          />
          <ReadingTimer
            minutesTotal={open.minutes ?? 0}
            onLog={(minutes) => logMinutes.mutate({ sessionId: open.id, minutes })}
          />
          <Button
            onPress={() => router.push(`/session?item=${itemId}`)}
            backgroundColor="transparent"
            borderColor="$borderColor"
            borderWidth={1}
            color="$accent"
            borderRadius={12}
            height={44}
            fontFamily="$body"
            fontWeight="600"
            fontSize={14.5}
          >
            Lire au calme
          </Button>
        </YStack>
      ) : (
        <Button
          onPress={() => start.mutate(totalPages)}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={46}
          fontFamily="$body"
          fontWeight="600"
        >
          Commencer la lecture
        </Button>
      )}

      {sessions && sessions.length > 0 ? (
        <YStack gap="$2">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              onRemove={() => remove.mutate(s.id)}
              onSave={(dates) => updateDates.mutateAsync({ sessionId: s.id, ...dates })}
            />
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const invalid = value.trim() !== '' && parseFlexibleDate(value) === null;
  return (
    <YStack flex={1} gap="$1">
      <Text fontFamily="$body" fontSize={11} color="$colorMuted">
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onChange}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor="$concreteLight"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        backgroundColor="$background"
        borderColor={invalid ? '$signal' : '$borderColor'}
        borderWidth={1}
        borderRadius={10}
        height={40}
        paddingHorizontal="$2"
        fontFamily="$body"
        fontSize={14}
        color="$color"
      />
    </YStack>
  );
}

function SessionRow({
  session,
  onRemove,
  onSave,
}: {
  session: ReadingSession;
  onRemove: () => void;
  onSave: (dates: { startedOn: string | null; finishedOn: string | null }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [startedOn, setStartedOn] = useState(session.started_on ?? '');
  const [finishedOn, setFinishedOn] = useState(session.finished_on ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const datePart = session.finished_on
    ? ` · lu le ${session.finished_on}`
    : session.started_on
      ? ` · depuis le ${session.started_on}`
      : '';

  const onSubmit = async () => {
    if (saving) return;
    setError(null);
    // Empty clears the date; otherwise it must parse.
    const start = startedOn.trim() ? parseFlexibleDate(startedOn) : '';
    const finish = finishedOn.trim() ? parseFlexibleDate(finishedOn) : '';
    if (start === null || finish === null) {
      setError('Date invalide. Essaie JJ/MM/AAAA (ex. 14/03/2019) ou juste l’année.');
      return;
    }
    if (start && finish && finish < start) {
      setError('La date de fin est avant la date de début.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ startedOn: start || null, finishedOn: finish || null });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  // One-tap shortcuts for the "lu le" date — most people just want a year.
  const thisYear = new Date().getFullYear();
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}/${thisYear}`;

  if (editing) {
    return (
      <YStack gap="$2" paddingVertical="$2" borderBottomColor="$borderColor" borderBottomWidth={1}>
        <XStack gap="$2">
          <DateField label="Début" value={startedOn} onChange={setStartedOn} />
          <DateField label="Fin (lu le)" value={finishedOn} onChange={setFinishedOn} />
        </XStack>
        <XStack gap="$2" flexWrap="wrap" alignItems="center">
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            Lu :
          </Text>
          {[
            { label: "Aujourd'hui", value: todayStr },
            ...[0, 1, 2, 3, 4].map((i) => ({
              label: String(thisYear - i),
              value: String(thisYear - i),
            })),
          ].map((opt) => (
            <Button
              key={opt.label}
              onPress={() => setFinishedOn(opt.value)}
              height={28}
              paddingHorizontal="$2"
              borderRadius={999}
              borderWidth={1}
              borderColor={finishedOn === opt.value ? '$accent' : '$borderColor'}
              backgroundColor={finishedOn === opt.value ? '$accent' : 'transparent'}
              color={finishedOn === opt.value ? palette.paper : '$colorSoft'}
              fontFamily="$body"
              fontSize={12.5}
              fontWeight="600"
            >
              {opt.label}
            </Button>
          ))}
        </XStack>
        {error ? (
          <Text fontFamily="$body" fontSize={12} color="$signal">
            {error}
          </Text>
        ) : null}
        <XStack gap="$2" alignItems="center">
          <Button
            onPress={onSubmit}
            disabled={saving}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={10}
            height={38}
            paddingHorizontal="$4"
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
            opacity={saving ? 0.6 : 1}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button
            onPress={() => {
              setStartedOn(session.started_on ?? '');
              setFinishedOn(session.finished_on ?? '');
              setError(null);
              setEditing(false);
            }}
            chromeless
            height={38}
            paddingHorizontal="$2"
            color="$colorMuted"
            fontFamily="$body"
            fontSize={14}
          >
            Annuler
          </Button>
        </XStack>
      </YStack>
    );
  }

  return (
    <XStack
      alignItems="center"
      gap="$1"
      paddingVertical="$1"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
    >
      <Text fontFamily="$body" fontSize={13} color="$colorSoft" flex={1}>
        {`p. ${session.current_page ?? 0}${session.total_pages ? `/${session.total_pages}` : ''} · ${SESSION_STATUS[session.status ?? ''] ?? '—'}`}
        {datePart}
      </Text>
      <Button
        onPress={() => setEditing(true)}
        chromeless
        height={28}
        paddingHorizontal="$2"
        color="$colorMuted"
        fontFamily="$body"
        fontSize={15}
      >
        ✎
      </Button>
      <Button
        onPress={onRemove}
        chromeless
        height={28}
        paddingHorizontal="$2"
        color="$colorMuted"
        fontFamily="$body"
        fontSize={18}
      >
        ✕
      </Button>
    </XStack>
  );
}

/** "MM:SS" (or "H:MM:SS" past an hour), monospaced so the clock doesn't jiggle. */
function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "45 min" / "2 h" / "2 h 15 min". */
function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem} min`;
}

/**
 * Reading chronometer for an open session. Times a reading sitting and, on "Terminer
 * la séance", credits the rounded minutes to the session + today's daily goal (via
 * log_reading_minutes). Timestamp-based so it stays accurate if the screen sleeps.
 */
function ReadingTimer({
  minutesTotal,
  onLog,
}: {
  minutesTotal: number;
  onLog: (minutes: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [baseSeconds, setBaseSeconds] = useState(0); // accumulated across pauses
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
  const idle = !running && elapsed === 0;

  const startOrResume = () => {
    setStartedAt(Date.now());
    setRunning(true);
  };
  const pause = () => {
    setBaseSeconds(elapsed);
    setStartedAt(null);
    setRunning(false);
  };
  const stop = () => {
    if (credit >= 1) onLog(credit);
    setRunning(false);
    setStartedAt(null);
    setBaseSeconds(0);
  };

  return (
    <YStack
      gap="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={16}
      padding="$3"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Label>Chrono de lecture</Label>
        {minutesTotal > 0 ? (
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            {fmtDuration(minutesTotal)} au total
          </Text>
        ) : null}
      </XStack>

      <Text
        fontFamily="$heading"
        fontSize={46}
        fontWeight="500"
        color={running ? palette.brick : '$color'}
        textAlign="center"
        fontVariant={['tabular-nums']}
      >
        {fmtClock(elapsed)}
      </Text>

      {idle ? (
        <Button
          onPress={startOrResume}
          backgroundColor={palette.brick}
          color={palette.paper}
          borderRadius={12}
          height={46}
          fontFamily="$body"
          fontWeight="700"
          pressStyle={{ opacity: 0.9 }}
        >
          Démarrer la séance
        </Button>
      ) : (
        <XStack gap="$2">
          <Button
            flex={1}
            onPress={running ? pause : startOrResume}
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            color="$color"
            borderRadius={12}
            height={46}
            fontFamily="$body"
            fontWeight="600"
          >
            {running ? 'Pause' : 'Reprendre'}
          </Button>
          <Button
            flex={1.4}
            onPress={stop}
            backgroundColor={palette.brick}
            color={palette.paper}
            borderRadius={12}
            height={46}
            fontFamily="$body"
            fontWeight="700"
            pressStyle={{ opacity: 0.9 }}
          >
            {credit >= 1 ? `Terminer · +${credit} min` : 'Terminer'}
          </Button>
        </XStack>
      )}
    </YStack>
  );
}

function Progress({
  session,
  onSetPage,
  onFinish,
}: {
  session: ReadingSession;
  onSetPage: (page: number) => void;
  onFinish: () => void;
}) {
  const total = session.total_pages ?? 0;
  const [page, setLocalPage] = useState(String(session.current_page ?? 0));
  useEffect(() => {
    setLocalPage(String(session.current_page ?? 0));
  }, [session.current_page]);

  const current = parseInt(page, 10) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const commit = (next: number) => {
    const clamped = total > 0 ? Math.max(0, Math.min(total, next)) : Math.max(0, next);
    setLocalPage(String(clamped));
    onSetPage(clamped);
  };

  return (
    <YStack gap="$3">
      <XStack alignItems="baseline" gap="$2">
        <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
          {`${current}${total ? ` / ${total}` : ''}`}
        </Text>
        <Text fontFamily="$body" fontSize={13} color="$colorMuted">
          pages
        </Text>
        {total ? (
          <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$accent" marginLeft="auto">
            {pct}%
          </Text>
        ) : null}
      </XStack>

      <YStack height={4} borderRadius={999} backgroundColor="$track" overflow="hidden">
        <YStack height={4} width={`${pct}%`} backgroundColor="$accent" />
      </YStack>

      <XStack gap="$2" alignItems="center">
        <Button
          onPress={() => commit(current - 10)}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={40}
          width={48}
          fontFamily="$body"
          fontSize={18}
        >
          −
        </Button>
        <Input
          flex={1}
          value={page}
          onChangeText={setLocalPage}
          onBlur={() => commit(parseInt(page, 10) || 0)}
          keyboardType="number-pad"
          textAlign="center"
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius={12}
          height={40}
          fontFamily="$body"
          fontSize={15}
          color="$color"
        />
        <Button
          onPress={() => commit(current + 10)}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={40}
          width={48}
          fontFamily="$body"
          fontSize={18}
        >
          +
        </Button>
        <Button
          onPress={onFinish}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={40}
          paddingHorizontal="$4"
          fontFamily="$body"
          fontWeight="600"
        >
          Terminer
        </Button>
      </XStack>
    </YStack>
  );
}
