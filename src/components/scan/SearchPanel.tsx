import { useState } from 'react';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import {
  type BookSearchParams,
  type BookSearchResult,
  useBookSearch,
} from '@/features/books/use-book-search';
import { composedPalette } from '@/theme/cover-palettes';
import { palette } from '@/theme/tokens';

type Field = 'q' | 'title' | 'author' | 'publisher' | 'subject';

const FIELDS: { key: Field; label: string }[] = [
  { key: 'q', label: 'Tout' },
  { key: 'title', label: 'Titre' },
  { key: 'author', label: 'Auteur' },
  { key: 'publisher', label: 'Éditeur' },
  { key: 'subject', label: 'Thème' },
];

const PLACEHOLDER: Record<Field, string> = {
  q: 'Titre, auteur, mot-clé…',
  title: 'Titre du livre',
  author: 'Nom de l’auteur',
  publisher: 'Nom de l’éditeur',
  subject: 'Thème ou sujet',
};

interface SearchPanelProps {
  onPick: (isbn13: string) => void;
  addedIsbns: Set<string>;
}

export function SearchPanel({ onPick, addedIsbns }: SearchPanelProps) {
  const [field, setField] = useState<Field>('q');
  const [query, setQuery] = useState('');
  const search = useBookSearch();

  const onSearch = () => {
    const q = query.trim();
    if (!q) return;
    const params: BookSearchParams = { [field]: q };
    search.mutate(params);
  };

  const results = search.data ?? [];

  return (
    <YStack gap="$3">
      <XStack gap="$2" flexWrap="wrap">
        {FIELDS.map((f) => {
          const active = f.key === field;
          return (
            <Button
              key={f.key}
              onPress={() => setField(f.key)}
              height={34}
              paddingHorizontal="$3"
              borderRadius={999}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$colorMuted'}
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
            >
              {f.label}
            </Button>
          );
        })}
      </XStack>

      <XStack gap="$2">
        <Input
          flex={1}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          placeholder={PLACEHOLDER[field]}
          autoCapitalize="none"
          autoCorrect={false}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius={12}
          height={48}
          paddingHorizontal="$3"
          fontFamily="$body"
          fontSize={15}
          color="$color"
          placeholderTextColor="$concreteLight"
          focusStyle={{ borderColor: '$accent' }}
        />
        <Button
          onPress={onSearch}
          disabled={search.isPending}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={48}
          paddingHorizontal="$5"
          fontFamily="$body"
          fontWeight="600"
        >
          {search.isPending ? <Spinner color={palette.paper} /> : 'Rechercher'}
        </Button>
      </XStack>

      {search.isError ? (
        <Text color="$signal" fontFamily="$body" fontSize={13}>
          Recherche impossible. Réessayez.
        </Text>
      ) : null}

      {!search.isPending && search.isSuccess && results.length === 0 ? (
        <Text color="$colorMuted" fontFamily="$body" fontSize={14}>
          Aucun résultat. Essayez un autre champ ou une autre orthographe.
        </Text>
      ) : null}

      <YStack gap="$2">
        {results.map((result) => (
          <ResultRow
            key={result.isbn13}
            result={result}
            added={addedIsbns.has(result.isbn13)}
            onPick={() => onPick(result.isbn13)}
          />
        ))}
      </YStack>
    </YStack>
  );
}

function ResultRow({
  result,
  added,
  onPick,
}: {
  result: BookSearchResult;
  added: boolean;
  onPick: () => void;
}) {
  const { bg, fg } = composedPalette(result.isbn13);
  const meta = [result.publisher, result.publishedDate].filter(Boolean).join(' · ');
  return (
    <XStack
      gap="$3"
      alignItems="center"
      padding="$2"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={12}
    >
      <BookCover
        title={result.title ?? 'Sans titre'}
        author={result.authors?.[0]}
        coverUrl={result.coverUrl}
        isbn={result.isbn13}
        bg={bg}
        fg={fg}
        width={56}
      />
      <YStack flex={1} gap={2}>
        <Text fontFamily="$heading" fontSize={14} color="$color" numberOfLines={1}>
          {result.title ?? 'Sans titre'}
        </Text>
        <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
          {result.authors?.[0] ?? 'Auteur inconnu'}
          {meta ? ` — ${meta}` : ''}
        </Text>
      </YStack>
      {added ? (
        <Text color="$positive" fontFamily="$body" fontSize={18} paddingHorizontal="$2">
          ✓
        </Text>
      ) : (
        <Button
          onPress={onPick}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={999}
          width={36}
          height={36}
          padding={0}
          fontFamily="$body"
          fontSize={20}
          fontWeight="600"
        >
          +
        </Button>
      )}
    </XStack>
  );
}
