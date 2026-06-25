import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { Button, Input, Spinner, type TamaguiElement, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Screen } from '@/components/Screen';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { useAuth } from '@/features/auth/auth-context';
import { type ScanEntry, useScanSession } from '@/features/scan/use-scan-session';
import { composedPalette } from '@/theme/cover-palettes';
import { palette } from '@/theme/tokens';

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={2.2}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

export default function ScanScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { entries, submit, retry, addedCount } = useScanSession(session?.user.id);
  const [value, setValue] = useState('');
  // Tamagui Input forwards its ref to the underlying TextInput at runtime.
  const inputRef = useRef<TamaguiElement>(null);

  const onSubmit = () => {
    const raw = value.trim();
    if (!raw) return;
    setValue('');
    (inputRef.current as { focus?: () => void } | null)?.focus?.();
    void submit(raw);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <YStack gap="$1" marginBottom="$4">
          <Label>Ajouter des livres</Label>
          <Text fontFamily="$heading" fontSize={33} fontWeight="500" color="$color">
            Scanner
          </Text>
        </YStack>

        <BarcodeScanner onScan={(v) => void submit(v)} />

        <YStack gap="$2" marginTop="$4">
          <Label>ISBN — saisie ou douchette</Label>
          <XStack gap="$2">
            <Input
              ref={inputRef}
              flex={1}
              value={value}
              onChangeText={setValue}
              onSubmitEditing={onSubmit}
              blurOnSubmit={false}
              autoFocus={Platform.OS === 'web'}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="978…"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
              height={48}
              paddingHorizontal="$3"
              fontFamily="$body"
              fontSize={15}
              color="$color"
              placeholderTextColor="$concreteLight"
              focusStyle={{ borderColor: '$accent' }}
            />
            <Button
              onPress={onSubmit}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={2}
              height={48}
              paddingHorizontal="$5"
              fontFamily="$body"
              fontWeight="600"
            >
              Ajouter
            </Button>
          </XStack>
        </YStack>

        {entries.length > 0 ? (
          <YStack gap="$2" marginTop="$5">
            <Label>{`Cette session — ${addedCount} ajouté${addedCount > 1 ? 's' : ''}`}</Label>
            {entries.map((entry) => (
              <EntryRow key={entry.key} entry={entry} onRetry={() => retry(entry.key)} />
            ))}
          </YStack>
        ) : null}
      </ScrollView>

      {addedCount > 0 ? (
        <YStack padding="$4" borderTopColor="$borderColor" borderTopWidth={1}>
          <Button
            onPress={() => router.push('/')}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={52}
            fontFamily="$body"
            fontWeight="600"
            fontSize={16}
          >
            {`Terminer · ${addedCount} livre${addedCount > 1 ? 's' : ''}`}
          </Button>
        </YStack>
      ) : null}
    </Screen>
  );
}

function EntryRow({ entry, onRetry }: { entry: ScanEntry; onRetry: () => void }) {
  const { bg, fg } = composedPalette(entry.isbn13 ?? entry.key);
  return (
    <XStack
      gap="$3"
      alignItems="center"
      padding="$2"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={2}
    >
      {entry.status === 'added' && entry.book ? (
        <BookCover
          title={entry.book.title ?? 'Sans titre'}
          author={entry.book.authors?.[0]}
          coverUrl={entry.book.cover_url}
          bg={bg}
          fg={fg}
          width={38}
        />
      ) : (
        <YStack width={38} height={57} alignItems="center" justifyContent="center">
          {entry.status === 'looking' ? (
            <Spinner color="$accent" />
          ) : (
            <Text color="$signal" fontFamily="$heading" fontSize={22}>
              !
            </Text>
          )}
        </YStack>
      )}

      <YStack flex={1} gap={2}>
        {entry.status === 'added' && entry.book ? (
          <>
            <Text fontFamily="$heading" fontSize={14} color="$color" numberOfLines={1}>
              {entry.book.title ?? 'Sans titre'}
            </Text>
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
              {entry.book.authors?.[0] ?? entry.isbn13}
            </Text>
          </>
        ) : entry.status === 'looking' ? (
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            {`Recherche… ${entry.isbn13 ?? entry.key}`}
          </Text>
        ) : (
          <>
            <Text fontFamily="$body" fontSize={13} color="$signal" numberOfLines={2}>
              {entry.error}
            </Text>
            <Text fontFamily="$body" fontSize={11} color="$colorMuted">
              {entry.isbn13 ?? entry.key}
            </Text>
          </>
        )}
      </YStack>

      {entry.status === 'error' ? (
        <Button onPress={onRetry} chromeless height={32} color="$accent" fontFamily="$body" fontWeight="600">
          Réessayer
        </Button>
      ) : entry.status === 'added' ? (
        <Text color="$positive" fontFamily="$body" fontSize={18}>
          ✓
        </Text>
      ) : null}
    </XStack>
  );
}
