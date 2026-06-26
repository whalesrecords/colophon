import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useCoverSearch } from '@/features/books/use-cover-search';
import { useUpdateItem } from '@/features/library/use-update-item';
import { palette } from '@/theme/tokens';

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={1.6}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

interface CoverPickerProps {
  itemId: string;
  userId: string | undefined;
  isbn13?: string;
  title: string;
  author?: string | null;
  hasOverride: boolean;
}

/** Let the user override a book's cover: deep-search candidates or paste a URL. */
export function CoverPicker({ itemId, userId, isbn13, title, author, hasOverride }: CoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const update = useUpdateItem(itemId, userId);
  const search = useCoverSearch();

  const setCover = (value: string | null) => {
    update.mutate({ cover_override: value });
    setOpen(false);
    setUrl('');
  };

  const candidates = search.data ?? [];

  return (
    <YStack gap="$2">
      <Text
        onPress={() => setOpen((o) => !o)}
        alignSelf="flex-start"
        paddingVertical="$2"
        color="$accent"
        fontFamily="$body"
        fontSize={14}
        fontWeight="600"
        pressStyle={{ opacity: 0.6 }}
      >
        {open ? 'Fermer' : 'Changer la couverture'}
      </Text>

      {open ? (
        <YStack
          gap="$4"
          padding="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={12}
          backgroundColor="$background"
        >
          <YStack gap="$2">
            <Label>Coller l'URL d'une image</Label>
            <XStack gap="$2">
              <Input
                flex={1}
                value={url}
                onChangeText={setUrl}
                placeholder="https://…/couverture.jpg"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="$concreteLight"
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
                height={42}
                paddingHorizontal="$3"
                fontFamily="$body"
                fontSize={14}
                color="$color"
              />
              <Button
                onPress={() => url.trim() && setCover(url.trim())}
                backgroundColor="$accent"
                color={palette.paper}
                borderRadius={12}
                height={42}
                paddingHorizontal="$4"
                fontFamily="$body"
                fontWeight="600"
              >
                Appliquer
              </Button>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Label>Recherche approfondie</Label>
            <Button
              onPress={() => search.mutate({ isbn13, title, author: author ?? undefined })}
              disabled={search.isPending}
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              color="$color"
              borderRadius={12}
              height={42}
              fontFamily="$body"
              fontWeight="600"
            >
              {search.isPending ? <Spinner color="$accent" /> : 'Chercher des couvertures'}
            </Button>
            {candidates.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$3" paddingVertical="$1">
                  {candidates.map((c, i) => (
                    <YStack key={`${c.url}-${i}`} gap={2} alignItems="center" width={72}>
                      <BookCover title={title} coverUrl={c.url} width={72} onPress={() => setCover(c.url)} />
                      <Text fontFamily="$body" fontSize={10} color="$colorMuted">
                        {c.source}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              </ScrollView>
            ) : search.isSuccess ? (
              <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                Aucune couverture trouvée — collez plutôt une URL d'image.
              </Text>
            ) : null}
          </YStack>

          {hasOverride ? (
            <Button
              onPress={() => setCover(null)}
              chromeless
              alignSelf="flex-start"
              height={32}
              paddingHorizontal={0}
              color="$signal"
              fontFamily="$body"
              fontSize={14}
            >
              Rétablir la couverture d'origine
            </Button>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
