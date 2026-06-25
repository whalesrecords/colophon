import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { type CircleMember } from '@/features/circles/use-circles';
import {
  type CircleBookRow,
  type ProposalRow,
  useBookComments,
  useCircleBookActions,
  useCircleLibrary,
  useCommentActions,
  useProposalActions,
  useProposals,
} from '@/features/circles/use-circle-spaces';
import { useLibrary } from '@/features/library/use-library';
import { composedPalette } from '@/theme/cover-palettes';
import { palette } from '@/theme/tokens';

const STATUS_LABEL: Record<string, string> = {
  to_read: 'À lire',
  reading: 'En cours',
  read: 'Lu',
  abandoned: 'Abandonné',
};
const STATUS_ORDER = ['to_read', 'reading', 'read', 'abandoned'];

function nameMap(members: CircleMember[] | undefined): Map<string, string> {
  return new Map((members ?? []).map((m) => [m.user_id, m.display_name ?? 'Membre']));
}

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

/** A horizontal strip of the user's own books, to contribute / propose by ISBN. */
function MyBooksPicker({ userId, onPick }: { userId: string | undefined; onPick: (isbn13: string) => void }) {
  const { data: items } = useLibrary(userId);
  const withBooks = (items ?? []).filter((i) => i.book?.isbn13);
  if (withBooks.length === 0) {
    return (
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        Votre bibliothèque est vide — ajoutez des livres d'abord.
      </Text>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack gap="$2" paddingVertical="$1">
        {withBooks.slice(0, 40).map((i) => (
          <BookCover
            key={i.id}
            title={i.book?.title ?? ''}
            coverUrl={i.coverOverride ?? i.book?.cover_url}
            isbn={i.book?.isbn13}
            width={52}
            onPress={() => onPick(i.book!.isbn13)}
          />
        ))}
      </XStack>
    </ScrollView>
  );
}

export function CircleLibrarySection({
  circleId,
  userId,
  members,
}: {
  circleId: string;
  userId: string | undefined;
  members: CircleMember[] | undefined;
}) {
  const { data: rows, isLoading } = useCircleLibrary(circleId);
  const { contribute } = useCircleBookActions(circleId, userId);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const names = useMemo(() => nameMap(members), [members]);

  // Group contributions by book.
  const books = useMemo(() => {
    const map = new Map<string, { book: CircleBookRow['book']; readers: CircleBookRow[] }>();
    for (const r of rows ?? []) {
      const g = map.get(r.isbn13) ?? { book: r.book, readers: [] };
      g.readers.push(r);
      map.set(r.isbn13, g);
    }
    return [...map.entries()].map(([isbn13, g]) => ({ isbn13, ...g }));
  }, [rows]);

  return (
    <YStack flex={1}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <YStack gap="$2">
          <Button
            onPress={() => setAdding((a) => !a)}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={44}
            fontFamily="$body"
            fontWeight="600"
          >
            {adding ? 'Fermer' : 'Ajouter de ma bibliothèque'}
        </Button>
        {adding ? (
          <MyBooksPicker
            userId={userId}
            onPick={(isbn13) => {
              contribute.mutate({ isbn13 });
              setAdding(false);
            }}
          />
        ) : null}
      </YStack>

      {isLoading ? (
        <Spinner color="$accent" />
      ) : books.length === 0 ? (
        <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
          Personne n'a encore ajouté de livre au cercle. Partagez vos lectures pour démarrer la
          bibliothèque commune.
        </Text>
      ) : (
        <YStack gap="$2">
          <Label>Bibliothèque du cercle</Label>
          {books.map((b) => {
            const read = b.readers.filter((r) => r.reading_status === 'read').length;
            return (
              <Button
                key={b.isbn13}
                onPress={() => setSelected(b.isbn13)}
                unstyled
                padding={0}
              >
                <XStack
                  gap="$3"
                  alignItems="center"
                  padding="$2"
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={2}
                  width="100%"
                >
                  <BookCover
                    title={b.book?.title ?? ''}
                    coverUrl={b.book?.cover_url}
                    isbn={b.isbn13}
                    width={40}
                  />
                  <YStack flex={1} gap={2}>
                    <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
                      {b.book?.title ?? 'Sans titre'}
                    </Text>
                    <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                      {`${b.readers.length} lecteur${b.readers.length > 1 ? 's' : ''}`}
                      {read > 0 ? ` · ${read} l'${read > 1 ? 'ont' : 'a'} lu` : ''}
                    </Text>
                  </YStack>
                  <Text fontFamily="$heading" fontSize={20} color="$colorMuted">
                    ›
                  </Text>
                </XStack>
              </Button>
            );
          })}
        </YStack>
      )}
      </ScrollView>

      {selected ? (
        <BookPanel
          circleId={circleId}
          userId={userId}
          isbn13={selected}
          row={(rows ?? []).find((r) => r.isbn13 === selected)?.book ?? null}
          readers={(rows ?? []).filter((r) => r.isbn13 === selected)}
          names={names}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </YStack>
  );
}

/** Book-in-circle detail: who reads it, my status, and the comment thread. */
function BookPanel({
  circleId,
  userId,
  isbn13,
  row,
  readers,
  names,
  onClose,
}: {
  circleId: string;
  userId: string | undefined;
  isbn13: string;
  row: CircleBookRow['book'];
  readers: CircleBookRow[];
  names: Map<string, string>;
  onClose: () => void;
}) {
  const { setStatus, remove, contribute } = useCircleBookActions(circleId, userId);
  const { data: comments } = useBookComments(circleId, isbn13);
  const { add, remove: removeComment } = useCommentActions(circleId, isbn13, userId);
  const [text, setText] = useState('');
  const mine = readers.find((r) => r.user_id === userId);
  const { bg, fg } = composedPalette(isbn13);

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
    >
      <XStack
        paddingHorizontal="$4"
        paddingTop="$5"
        paddingBottom="$3"
        gap="$3"
        alignItems="center"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
      >
        <BookCover title={row?.title ?? ''} coverUrl={row?.cover_url} isbn={isbn13} bg={bg} fg={fg} width={44} />
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={17} color="$color" numberOfLines={2}>
            {row?.title ?? 'Sans titre'}
          </Text>
          {row?.authors?.[0] ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" numberOfLines={1}>
              {row.authors[0]}
            </Text>
          ) : null}
        </YStack>
        <Button onPress={onClose} chromeless color="$accent" fontFamily="$body" fontWeight="600">
          Fermer
        </Button>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
        <YStack gap="$2">
          <Label>Mon suivi dans le cercle</Label>
          <XStack gap="$2" flexWrap="wrap">
            {STATUS_ORDER.map((s) => {
              const active = mine?.reading_status === s;
              return (
                <Button
                  key={s}
                  onPress={() =>
                    mine ? setStatus.mutate({ isbn13, status: s }) : contribute.mutate({ isbn13, status: s })
                  }
                  height={34}
                  paddingHorizontal="$3"
                  borderRadius={999}
                  borderWidth={1}
                  borderColor={active ? '$accent' : '$borderColor'}
                  backgroundColor={active ? '$accent' : 'transparent'}
                  color={active ? palette.paper : '$colorSoft'}
                  fontFamily="$body"
                  fontSize={13}
                  fontWeight="500"
                >
                  {STATUS_LABEL[s]}
                </Button>
              );
            })}
          </XStack>
          {mine ? (
            <Button
              onPress={() => {
                remove.mutate(isbn13);
                onClose();
              }}
              chromeless
              alignSelf="flex-start"
              paddingHorizontal={0}
              color="$signal"
              fontFamily="$body"
              fontSize={13}
            >
              Retirer du cercle
            </Button>
          ) : null}
        </YStack>

        <YStack gap="$2">
          <Label>Lecteurs</Label>
          {readers.length === 0 ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted">
              Personne ne l'a encore dans sa sélection du cercle.
            </Text>
          ) : (
            readers.map((r) => (
              <XStack key={r.user_id} justifyContent="space-between" paddingVertical="$1">
                <Text fontFamily="$body" fontSize={14} color="$color">
                  {names.get(r.user_id) ?? 'Membre'}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                  {STATUS_LABEL[r.reading_status] ?? r.reading_status}
                </Text>
              </XStack>
            ))
          )}
        </YStack>

        <YStack gap="$2">
          <Label>Commentaires</Label>
          {(comments ?? []).map((c) => (
            <YStack
              key={c.id}
              gap={2}
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontFamily="$body" fontSize={12} fontWeight="600" color="$colorSoft">
                  {names.get(c.user_id) ?? 'Membre'}
                </Text>
                {c.user_id === userId ? (
                  <Button
                    onPress={() => removeComment.mutate(c.id)}
                    chromeless
                    height={22}
                    paddingHorizontal={0}
                    color="$colorMuted"
                    fontFamily="$body"
                    fontSize={14}
                  >
                    ✕
                  </Button>
                ) : null}
              </XStack>
              <Text fontFamily="$body" fontSize={14} color="$color" lineHeight={20}>
                {c.body}
              </Text>
            </YStack>
          ))}
          <XStack gap="$2">
            <Input
              flex={1}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => {
                if (text.trim()) {
                  add.mutate(text);
                  setText('');
                }
              }}
              placeholder="Votre commentaire…"
              placeholderTextColor="$concreteLight"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
              height={42}
              paddingHorizontal="$3"
              fontFamily="$body"
              fontSize={14}
              color="$color"
            />
            <Button
              onPress={() => {
                if (text.trim()) {
                  add.mutate(text);
                  setText('');
                }
              }}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={2}
              height={42}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
            >
              Publier
            </Button>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

export function CircleProposalsSection({
  circleId,
  userId,
  members,
  isOwner,
}: {
  circleId: string;
  userId: string | undefined;
  members: CircleMember[] | undefined;
  isOwner: boolean;
}) {
  const { data: proposals, isLoading } = useProposals(circleId);
  const { propose, toggleVote, setStatus, remove } = useProposalActions(circleId, userId);
  const [adding, setAdding] = useState(false);
  const names = useMemo(() => nameMap(members), [members]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <YStack gap="$4">
      <YStack gap="$2">
        <Button
          onPress={() => setAdding((a) => !a)}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={2}
          height={44}
          fontFamily="$body"
          fontWeight="600"
        >
          {adding ? 'Fermer' : 'Proposer un livre'}
        </Button>
        {adding ? (
          <MyBooksPicker
            userId={userId}
            onPick={(isbn13) => {
              propose.mutate({ isbn13 });
              setAdding(false);
            }}
          />
        ) : null}
      </YStack>

      {isLoading ? (
        <Spinner color="$accent" />
      ) : (proposals ?? []).length === 0 ? (
        <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
          Aucune proposition. Proposez un livre à lire ensemble — les membres voteront.
        </Text>
      ) : (
        <YStack gap="$2">
          {(proposals ?? []).map((p) => (
            <ProposalRowView
              key={p.id}
              proposal={p}
              userId={userId}
              isOwner={isOwner}
              proposer={names.get(p.proposed_by) ?? 'Membre'}
              onVote={() => toggleVote.mutate(p.id)}
              onSelect={() => setStatus.mutate({ id: p.id, status: 'selected' })}
              onArchive={() => setStatus.mutate({ id: p.id, status: 'archived' })}
              onDelete={() => remove.mutate(p.id)}
            />
          ))}
        </YStack>
      )}
      </YStack>
    </ScrollView>
  );
}

function ProposalRowView({
  proposal,
  userId,
  isOwner,
  proposer,
  onVote,
  onSelect,
  onArchive,
  onDelete,
}: {
  proposal: ProposalRow;
  userId: string | undefined;
  isOwner: boolean;
  proposer: string;
  onVote: () => void;
  onSelect: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const votes = proposal.votes ?? [];
  const iVoted = votes.some((v) => v.user_id === userId);
  const canModerate = isOwner || proposal.proposed_by === userId;
  return (
    <YStack
      gap="$2"
      padding="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={2}
    >
      <XStack gap="$3" alignItems="center">
        <BookCover
          title={proposal.book?.title ?? ''}
          coverUrl={proposal.book?.cover_url}
          isbn={proposal.isbn13}
          width={40}
        />
        <YStack flex={1} gap={2}>
          <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
            {proposal.book?.title ?? 'Sans titre'}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
            Proposé par {proposer}
          </Text>
        </YStack>
        <Button
          onPress={onVote}
          height={36}
          paddingHorizontal="$3"
          borderRadius={999}
          borderWidth={1}
          borderColor={iVoted ? '$accent' : '$borderColor'}
          backgroundColor={iVoted ? '$accent' : 'transparent'}
          color={iVoted ? palette.paper : '$colorSoft'}
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
        >
          {`♥ ${votes.length}`}
        </Button>
      </XStack>
      {proposal.note ? (
        <Text fontFamily="$body" fontSize={13} color="$colorSoft" lineHeight={19}>
          {proposal.note}
        </Text>
      ) : null}
      {canModerate ? (
        <XStack gap="$3">
          <Button onPress={onSelect} chromeless paddingHorizontal={0} color="$accent" fontFamily="$body" fontSize={13} fontWeight="600">
            Choisir
          </Button>
          <Button onPress={onArchive} chromeless paddingHorizontal={0} color="$colorMuted" fontFamily="$body" fontSize={13}>
            Archiver
          </Button>
          <Button onPress={onDelete} chromeless paddingHorizontal={0} color="$signal" fontFamily="$body" fontSize={13}>
            Supprimer
          </Button>
        </XStack>
      ) : null}
    </YStack>
  );
}
