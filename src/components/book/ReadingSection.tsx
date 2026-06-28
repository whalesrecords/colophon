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
  const { data: sessions } = useReadingSessions(itemId);
  const { start, setPage, finish, remove, updateDates } = useSessionActions(itemId, userId);
  const open = sessions?.find((s) => s.status === 'reading');

  return (
    <YStack gap="$3">
      <Label>Suivi de lecture</Label>

      {open ? (
        <Progress
          session={open}
          onSetPage={(page) => setPage.mutate({ sessionId: open.id, page })}
          onFinish={() => finish.mutate(open.id)}
        />
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

  if (editing) {
    return (
      <YStack gap="$2" paddingVertical="$2" borderBottomColor="$borderColor" borderBottomWidth={1}>
        <XStack gap="$2">
          <DateField label="Début" value={startedOn} onChange={setStartedOn} />
          <DateField label="Fin (lu le)" value={finishedOn} onChange={setFinishedOn} />
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
