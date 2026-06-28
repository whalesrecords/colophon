import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share as RNShare,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, TextArea, XStack, YStack } from 'tamagui';

import { CircleLibrarySection, CircleProposalsSection } from '@/components/circle/CircleSpaces';
import { useAuth } from '@/features/auth/auth-context';
import {
  type CircleEvent,
  type EventRsvp,
  googleCalendarUrl,
  type Message,
  type RsvpStatus,
  useCircle,
  useCircleEvents,
  useCircleMembers,
  useBlockedUsers,
  useCircleMessages,
  useDeleteMessage,
  useEventActions,
  useEventRsvps,
  useLeaveCircle,
  useMarkCircleRead,
  useModeration,
  useSendMessage,
  useSetRsvp,
} from '@/features/circles/use-circles';
import { palette } from '@/theme/tokens';

export default function CircleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: circle } = useCircle(id);
  const { data: members } = useCircleMembers(id);
  const { data: messages, isLoading } = useCircleMessages(id);
  const send = useSendMessage(id, userId);
  const deleteMessage = useDeleteMessage(id, userId);
  const isOwner = circle?.owner_id === userId;
  const markRead = useMarkCircleRead(userId);
  const leave = useLeaveCircle(userId);
  const { data: blocked } = useBlockedUsers(userId);
  const { report, block, unblock } = useModeration(userId);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [section, setSection] = useState<'chat' | 'library' | 'proposals' | 'agenda'>('chat');
  const scrollRef = useRef<ScrollView>(null);

  // Mark the discussion read while it's open (clears the unread badge), and again
  // when new messages arrive as you watch.
  useEffect(() => {
    if (section === 'chat' && id) markRead.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, id, messages?.length]);
  const { width } = useWindowDimensions();
  const padH = Math.max(16, (width - 800) / 2);

  const onInvite = async () => {
    if (!circle) return;
    const message = `Rejoins mon cercle de lecture « ${circle.name} » sur Colophon. Code d'invitation : ${circle.invite_code}`;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(message);
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined') {
        window.location.href = `mailto:?subject=${encodeURIComponent(
          `Rejoins « ${circle.name} » sur Colophon`,
        )}&body=${encodeURIComponent(message)}`;
      }
    } else {
      RNShare.share({ message }).catch(() => undefined);
    }
  };

  const memberCount = members?.length ?? 0;
  const nameByUser = new Map((members ?? []).map((m) => [m.user_id, m.display_name ?? 'Membre']));

  const blockedSet = blocked ?? new Set<string>();
  const visibleMessages = (messages ?? []).filter((m) => !blockedSet.has(m.user_id));
  const blockedMembers = (members ?? []).filter((m) => blockedSet.has(m.user_id));

  const confirm = (title: string, message: string, ok: string): Promise<boolean> =>
    new Promise((resolve) => {
      if (Platform.OS === 'web') {
        resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
      } else {
        Alert.alert(title, message, [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          { text: ok, style: 'destructive', onPress: () => resolve(true) },
        ]);
      }
    });

  const notify = (msg: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('Colophon', msg);
    }
  };

  const onReport = async (m: Message) => {
    const ok = await confirm(
      'Signaler ce message',
      'Notre équipe examinera ce contenu. Voulez-vous le signaler ?',
      'Signaler',
    );
    if (!ok) return;
    try {
      await report.mutateAsync({ messageId: m.id, circleId: id, reportedUserId: m.user_id });
      notify('Message signalé. Merci — nous allons l’examiner.');
    } catch {
      notify('Impossible de signaler pour le moment.');
    }
  };

  const onDeleteMessage = async (m: Message) => {
    const ok = await confirm(
      'Supprimer ce message',
      'Ce message sera retiré pour tout le monde.',
      'Supprimer',
    );
    if (!ok) return;
    try {
      await deleteMessage.mutateAsync(m.id);
    } catch {
      notify('Suppression impossible pour le moment.');
    }
  };

  const onBlock = async (m: Message) => {
    const name = nameByUser.get(m.user_id) ?? 'ce membre';
    const ok = await confirm(
      `Bloquer ${name}`,
      'Vous ne verrez plus ses messages dans ce cercle. Vous pourrez le réafficher ensuite.',
      'Bloquer',
    );
    if (!ok) return;
    try {
      await block.mutateAsync(m.user_id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages?.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    setSendError(null);
    try {
      await send.mutateAsync(body);
    } catch (e) {
      setText(body);
      setSendError(e instanceof Error ? e.message : "Échec de l'envoi.");
    }
  };

  const onLeave = async () => {
    try {
      await leave.mutateAsync(id);
      router.back();
    } catch {
      // ignore
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text fontFamily="$heading" fontSize={24} color="$color">
            ‹
          </Text>
        </Pressable>
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={1}>
            {circle?.name ?? 'Cercle'}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            {memberCount} membre{memberCount > 1 ? 's' : ''}
            {circle?.invite_code ? ` · code ${circle.invite_code}` : ''}
          </Text>
        </YStack>
        <Button
          onPress={onInvite}
          chromeless
          height={32}
          paddingHorizontal="$2"
          color="$accent"
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
        >
          Inviter
        </Button>
        {!isOwner ? (
          <Button
            onPress={onLeave}
            chromeless
            height={32}
            paddingHorizontal="$2"
            color="$colorMuted"
            fontFamily="$body"
            fontSize={13}
          >
            Quitter
          </Button>
        ) : null}
      </XStack>

      <XStack borderBottomColor="$borderColor" borderBottomWidth={1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack paddingHorizontal="$3" paddingVertical="$2" gap="$2">
            <SegTab
              label="Discussion"
              active={section === 'chat'}
              onPress={() => setSection('chat')}
            />
            <SegTab
              label="Bibliothèque"
              active={section === 'library'}
              onPress={() => setSection('library')}
            />
            <SegTab
              label="Propositions"
              active={section === 'proposals'}
              onPress={() => setSection('proposals')}
            />
            <SegTab
              label="Rendez-vous"
              active={section === 'agenda'}
              onPress={() => setSection('agenda')}
            />
          </XStack>
        </ScrollView>
      </XStack>

      {section === 'agenda' ? (
        <AgendaSection circleId={id} userId={userId} />
      ) : section === 'library' ? (
        <CircleLibrarySection circleId={id} userId={userId} members={members} />
      ) : section === 'proposals' ? (
        <CircleProposalsSection
          circleId={id}
          userId={userId}
          members={members}
          isOwner={circle?.owner_id === userId}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top + 56}
        >
          {isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Spinner color="$accent" />
            </YStack>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{
                paddingHorizontal: padH,
                paddingTop: 16,
                gap: 10,
                paddingBottom: 20,
              }}
            >
              {blockedMembers.length > 0 ? (
                <YStack
                  gap="$1"
                  padding="$2"
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={12}
                >
                  <Text fontFamily="$body" fontSize={11} color="$colorMuted">
                    {`${blockedMembers.length} membre${blockedMembers.length > 1 ? 's' : ''} masqué${blockedMembers.length > 1 ? 's' : ''}`}
                  </Text>
                  {blockedMembers.map((bm) => (
                    <XStack key={bm.user_id} alignItems="center" justifyContent="space-between">
                      <Text fontFamily="$body" fontSize={13} color="$colorSoft">
                        {bm.display_name ?? 'Membre'}
                      </Text>
                      <Button
                        onPress={() => unblock.mutate(bm.user_id)}
                        chromeless
                        height={26}
                        paddingHorizontal={0}
                        color="$accent"
                        fontFamily="$body"
                        fontSize={13}
                        fontWeight="600"
                      >
                        Réafficher
                      </Button>
                    </XStack>
                  ))}
                </YStack>
              ) : null}

              {visibleMessages.length === 0 ? (
                <Text
                  fontFamily="$body"
                  fontSize={14}
                  color="$colorMuted"
                  textAlign="center"
                  marginTop="$8"
                >
                  Démarrez la discussion — partagez vos impressions de lecture.
                </Text>
              ) : (
                visibleMessages.map((m) => (
                  <Bubble
                    key={m.id}
                    message={m}
                    mine={m.user_id === userId}
                    canModerate={isOwner}
                    author={nameByUser.get(m.user_id) ?? 'Membre'}
                    onReport={() => onReport(m)}
                    onBlock={() => onBlock(m)}
                    onDelete={() => onDeleteMessage(m)}
                  />
                ))
              )}
            </ScrollView>
          )}

          {sendError ? (
            <Text
              fontFamily="$body"
              fontSize={12}
              color="$signal"
              paddingHorizontal={padH}
              paddingTop="$2"
              backgroundColor="$backgroundStrong"
            >
              {sendError}
            </Text>
          ) : null}

          <XStack
            gap="$2"
            paddingHorizontal={padH}
            paddingTop="$3"
            paddingBottom={insets.bottom + 8}
            borderTopColor="$borderColor"
            borderTopWidth={1}
            backgroundColor="$backgroundStrong"
          >
            <Input
              flex={1}
              value={text}
              onChangeText={(v) => {
                setText(v);
                if (sendError) setSendError(null);
              }}
              onSubmitEditing={onSend}
              placeholder="Votre message…"
              placeholderTextColor="$concreteLight"
              backgroundColor="$background"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={20}
              height={42}
              paddingHorizontal="$3"
              fontFamily="$body"
              fontSize={14}
              color="$color"
            />
            <Button
              onPress={onSend}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={999}
              height={42}
              width={42}
              padding={0}
              fontFamily="$heading"
              fontSize={18}
            >
              ↑
            </Button>
          </XStack>
        </KeyboardAvoidingView>
      )}
    </YStack>
  );
}

function SegTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      height={34}
      paddingHorizontal="$4"
      borderRadius={12}
      borderWidth={1}
      borderColor={active ? '$accent' : '$borderColor'}
      backgroundColor={active ? '$accent' : 'transparent'}
      color={active ? palette.paper : '$colorMuted'}
      fontFamily="$body"
      fontSize={14}
      fontWeight="600"
    >
      {label}
    </Button>
  );
}

function fmtEvent(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AgendaSection({ circleId, userId }: { circleId: string; userId: string | undefined }) {
  const { data: events } = useCircleEvents(circleId);
  const { createEvent, deleteEvent } = useEventActions(circleId, userId);
  const { data: rsvps } = useEventRsvps(circleId, userId);
  const setRsvp = useSetRsvp(circleId, userId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    setError(null);
    try {
      await createEvent.mutateAsync({
        title,
        startsAt: `${date.trim()}T${time.trim() || '00:00'}`,
        location,
      });
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const now = Date.now();
  const upcoming = (events ?? []).filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = (events ?? []).filter((e) => new Date(e.starts_at).getTime() < now).reverse();

  const field = {
    backgroundColor: '$background' as const,
    borderColor: '$borderColor' as const,
    borderWidth: 1,
    borderRadius: 12,
    height: 42,
    paddingHorizontal: '$3' as const,
    fontFamily: '$body' as const,
    fontSize: 14,
    color: '$color' as const,
    placeholderTextColor: '$concreteLight' as const,
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>
      <YStack
        gap="$2"
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={12}
        padding="$3"
      >
        <Text
          fontFamily="$body"
          fontSize={11}
          fontWeight="600"
          letterSpacing={2}
          textTransform="uppercase"
          color="$colorMuted"
        >
          Nouveau rendez-vous
        </Text>
        <Input
          {...field}
          value={title}
          onChangeText={setTitle}
          placeholder="Titre (ex. Réunion mensuelle)"
        />
        <XStack gap="$2">
          <Input
            {...field}
            flex={1}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            placeholder="Date AAAA-MM-JJ"
          />
          <Input
            {...field}
            width={110}
            value={time}
            onChangeText={setTime}
            autoCapitalize="none"
            placeholder="HH:MM"
          />
        </XStack>
        <Input
          {...field}
          value={location}
          onChangeText={setLocation}
          placeholder="Lieu (optionnel)"
        />
        <Button
          onPress={onCreate}
          disabled={createEvent.isPending}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={44}
          fontFamily="$body"
          fontWeight="600"
        >
          Proposer au cercle
        </Button>
        {error ? (
          <Text fontFamily="$body" fontSize={13} color="$signal">
            {error}
          </Text>
        ) : null}
      </YStack>

      {upcoming.length > 0 ? (
        <YStack gap="$2">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="600"
            letterSpacing={2}
            textTransform="uppercase"
            color="$colorMuted"
          >
            À venir
          </Text>
          {upcoming.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              mine={e.created_by === userId}
              rsvp={rsvps?.get(e.id)}
              onSetRsvp={(status) => setRsvp.mutate({ eventId: e.id, status })}
              onDelete={() => deleteEvent.mutate(e.id)}
            />
          ))}
        </YStack>
      ) : (
        <Text fontFamily="$body" fontSize={14} color="$colorMuted">
          Aucun rendez-vous à venir. Proposez-en un au cercle.
        </Text>
      )}

      {past.length > 0 ? (
        <YStack gap="$2" opacity={0.6}>
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="600"
            letterSpacing={2}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Passés
          </Text>
          {past.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              mine={e.created_by === userId}
              rsvp={rsvps?.get(e.id)}
              onSetRsvp={(status) => setRsvp.mutate({ eventId: e.id, status })}
              onDelete={() => deleteEvent.mutate(e.id)}
              past
            />
          ))}
        </YStack>
      ) : null}
    </ScrollView>
  );
}

function RsvpPill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      height={30}
      paddingHorizontal="$3"
      borderRadius={999}
      borderWidth={1}
      borderColor={active ? color : '$borderColor'}
      backgroundColor={active ? color : 'transparent'}
      color={active ? palette.paper : '$colorSoft'}
      fontFamily="$body"
      fontSize={13}
      fontWeight="600"
      pressStyle={{ opacity: 0.8 }}
    >
      {label}
    </Button>
  );
}

function EventRow({
  event,
  mine,
  rsvp,
  onSetRsvp,
  onDelete,
  past,
}: {
  event: CircleEvent;
  mine: boolean;
  rsvp: EventRsvp | undefined;
  onSetRsvp: (status: RsvpStatus | null) => void;
  onDelete: () => void;
  past?: boolean;
}) {
  const toggle = (s: RsvpStatus) => onSetRsvp(rsvp?.mine === s ? null : s);
  const going = rsvp?.going ?? 0;
  return (
    <YStack
      gap="$2"
      padding="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={12}
    >
      <XStack gap="$2" alignItems="flex-start">
        <YStack flex={1} gap={2}>
          <Text fontFamily="$heading" fontSize={16} color="$color" numberOfLines={1}>
            {event.title}
          </Text>
          <Text fontFamily="$body" fontSize={13} color="$accent" fontWeight="600">
            {fmtEvent(event.starts_at)}
          </Text>
          {event.location ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" numberOfLines={1}>
              {event.location}
            </Text>
          ) : null}
          {going > 0 ? (
            <Text fontFamily="$body" fontSize={12} color={palette.sage} fontWeight="600">
              {going === 1 ? '1 participant' : `${going} participants`}
            </Text>
          ) : null}
        </YStack>
        {mine ? (
          <Button
            onPress={onDelete}
            chromeless
            height={28}
            paddingHorizontal="$2"
            color="$colorMuted"
            fontFamily="$body"
            fontSize={16}
          >
            ✕
          </Button>
        ) : null}
      </XStack>

      {!past ? (
        <XStack gap="$2" flexWrap="wrap" alignItems="center">
          <RsvpPill
            label="Je viens"
            active={rsvp?.mine === 'going'}
            color={palette.sage}
            onPress={() => toggle('going')}
          />
          <RsvpPill
            label="Peut-être"
            active={rsvp?.mine === 'maybe'}
            color={palette.ochre}
            onPress={() => toggle('maybe')}
          />
          <RsvpPill
            label="Non"
            active={rsvp?.mine === 'no'}
            color={palette.concrete}
            onPress={() => toggle('no')}
          />
          <Text
            onPress={() => void Linking.openURL(googleCalendarUrl(event))}
            fontFamily="$body"
            fontSize={13}
            fontWeight="600"
            color="$accent"
            paddingHorizontal="$2"
            paddingVertical="$1"
            pressStyle={{ opacity: 0.6 }}
          >
            ＋ Google Agenda
          </Text>
        </XStack>
      ) : null}
    </YStack>
  );
}

function Bubble({
  message,
  mine,
  canModerate,
  author,
  onReport,
  onBlock,
  onDelete,
}: {
  message: Message;
  mine: boolean;
  canModerate?: boolean;
  author: string;
  onReport?: () => void;
  onBlock?: () => void;
  onDelete?: () => void;
}) {
  const [menu, setMenu] = useState(false);
  // You can delete your own messages; a circle owner can delete anyone's.
  const canDelete = !!onDelete && (mine || canModerate);
  const hasMenu = canDelete || (!mine && (onReport || onBlock));
  return (
    <YStack alignSelf={mine ? 'flex-end' : 'flex-start'} maxWidth="80%" gap={2}>
      {!mine ? (
        <Text fontFamily="$body" fontSize={11} color="$colorMuted" marginLeft="$2">
          {author}
        </Text>
      ) : null}
      <YStack
        backgroundColor={mine ? '$accent' : '$backgroundStrong'}
        borderColor={mine ? '$accent' : '$borderColor'}
        borderWidth={1}
        borderRadius={14}
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <Text
          fontFamily="$body"
          fontSize={14}
          color={mine ? palette.paper : '$color'}
          lineHeight={20}
        >
          {message.body}
        </Text>
      </YStack>
      {hasMenu ? (
        <YStack gap={2} alignSelf={mine ? 'flex-end' : 'flex-start'}>
          <Pressable onPress={() => setMenu((o) => !o)} hitSlop={8}>
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" marginHorizontal="$2">
              {menu ? 'Fermer' : '⋯'}
            </Text>
          </Pressable>
          {menu ? (
            <XStack gap="$3" marginHorizontal="$2">
              {!mine && onReport ? (
                <Button
                  onPress={() => {
                    setMenu(false);
                    onReport();
                  }}
                  chromeless
                  height={24}
                  paddingHorizontal={0}
                  color="$accent"
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="600"
                >
                  Signaler
                </Button>
              ) : null}
              {!mine && onBlock ? (
                <Button
                  onPress={() => {
                    setMenu(false);
                    onBlock();
                  }}
                  chromeless
                  height={24}
                  paddingHorizontal={0}
                  color="$signal"
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="600"
                >
                  Bloquer
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  onPress={() => {
                    setMenu(false);
                    onDelete?.();
                  }}
                  chromeless
                  height={24}
                  paddingHorizontal={0}
                  color="$signal"
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="600"
                >
                  Supprimer
                </Button>
              ) : null}
            </XStack>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
