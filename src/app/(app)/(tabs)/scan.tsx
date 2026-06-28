import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Input, type TamaguiElement, Text, TextArea, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { AddSheet } from '@/components/scan/AddSheet';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { SearchPanel } from '@/components/scan/SearchPanel';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { type BookMetadata, useIsbnLookup } from '@/features/books/use-isbn-lookup';
import { useCsvImport } from '@/features/library/use-csv-import';
import { useLibrary } from '@/features/library/use-library';
import { useT } from '@/i18n';
import { type ScanEntry, useScanSession } from '@/features/scan/use-scan-session';
import { parseBookCsv } from '@/lib/book-csv';
import { parseIsbnList } from '@/lib/isbn-list';
import type { Ownership, ReadingStatus } from '@/theme/tokens';
import { composedPalette } from '@/theme/cover-palettes';
import { palette } from '@/theme/tokens';

type Mode = 'scan' | 'search' | 'import';

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

function ModeTab({
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
      flex={1}
      height={40}
      borderRadius={12}
      borderWidth={1}
      borderColor={active ? '$accent' : '$borderColor'}
      backgroundColor={active ? '$accent' : 'transparent'}
      color={active ? palette.paper : '$colorMuted'}
      fontFamily="$body"
      fontWeight="600"
      fontSize={14}
    >
      {label}
    </Button>
  );
}

export default function ScanScreen() {
  const { t } = useT();
  const { session } = useAuth();
  const router = useRouter();
  const { entries, submitResolved, submitMany, retry, addedCount, bulk } = useScanSession(
    session?.user.id,
  );
  const { data: library } = useLibrary(session?.user.id);
  // Snapshot what's already owned when the screen opens, so scanning a book you
  // already have flags it immediately (the in-store duplicate check).
  const ownedAtOpen = useRef<Map<string, number> | null>(null);
  if (library && ownedAtOpen.current === null) {
    const counts = new Map<string, number>();
    for (const i of library) {
      const k = i.book?.isbn13;
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    ownedAtOpen.current = counts;
  }
  const [mode, setMode] = useState<Mode>('scan');
  const [value, setValue] = useState('');
  const [listText, setListText] = useState('');
  const isbnList = useMemo(() => parseIsbnList(listText), [listText]);
  const [importKind, setImportKind] = useState<'isbn' | 'csv'>('isbn');
  const [csvText, setCsvText] = useState('');
  const parsedCsv = useMemo(() => parseBookCsv(csvText), [csvText]);
  const csvImport = useCsvImport(session?.user.id);
  const lookup = useIsbnLookup();
  const [pendingBook, setPendingBook] = useState<BookMetadata | null>(null);
  const [committing, setCommitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const pickCsvFile = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setCsvText(String(reader.result ?? ''));
      reader.readAsText(file);
    };
    input.click();
  };
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 720) / 2);
  // Desktop browsers / iPad-app-on-Mac expose no usable camera; route to manual ISBN.
  const noCamera =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    !navigator.mediaDevices?.getUserMedia;
  // Tamagui Input forwards its ref to the underlying TextInput at runtime.
  const inputRef = useRef<TamaguiElement>(null);

  const addedIsbns = useMemo(
    () =>
      new Set(
        entries.filter((e) => e.status === 'added' && e.isbn13).map((e) => e.isbn13 as string),
      ),
    [entries],
  );

  // Resolve a book then open the "possession en 1 tap" sheet (instead of auto-adding).
  const openAddSheet = async (raw: string) => {
    if (pendingBook || lookup.isPending) return;
    setResolveError(null);
    try {
      const book = await lookup.mutateAsync(raw);
      setPendingBook(book);
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : t('scan.notFound'));
    }
  };

  const commitAdd = async (opts: { ownership: Ownership; status: ReadingStatus }) => {
    if (!pendingBook) return;
    setCommitting(true);
    await submitResolved(pendingBook, opts);
    setCommitting(false);
    setPendingBook(null);
    (inputRef.current as { focus?: () => void } | null)?.focus?.();
  };

  const onSubmit = () => {
    const raw = value.trim();
    if (!raw) return;
    setValue('');
    void openAddSheet(raw);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack gap="$3" marginBottom="$4">
          <YStack gap="$1">
            <Label>{t('scan.addBooks')}</Label>
            <Text fontFamily="$heading" fontSize={33} fontWeight="500" color="$color">
              {t('scan.add')}
            </Text>
          </YStack>
          <XStack gap="$2" flexWrap="wrap">
            <ModeTab
              label={t('scan.modeScan')}
              active={mode === 'scan'}
              onPress={() => setMode('scan')}
            />
            <ModeTab
              label={t('scan.modeSearch')}
              active={mode === 'search'}
              onPress={() => setMode('search')}
            />
            <ModeTab
              label={t('scan.modeImport')}
              active={mode === 'import'}
              onPress={() => setMode('import')}
            />
          </XStack>
        </YStack>

        {mode === 'import' ? (
          <YStack gap="$3">
            <XStack gap="$2">
              <ModeTab
                label={t('scan.importIsbnList')}
                active={importKind === 'isbn'}
                onPress={() => setImportKind('isbn')}
              />
              <ModeTab
                label={t('scan.importCsvTab')}
                active={importKind === 'csv'}
                onPress={() => setImportKind('csv')}
              />
            </XStack>

            {importKind === 'isbn' ? (
              <>
                <Label>{t('scan.pasteIsbnList')}</Label>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={19}>
                  {t('scan.pasteIsbnHint')}
                  {isbnList.length > 0
                    ? ` ${isbnList.length > 1 ? t('scan.isbnDetectedMany', { count: isbnList.length }) : t('scan.isbnDetectedOne', { count: isbnList.length })}`
                    : ''}
                </Text>
                <TextArea
                  value={listText}
                  onChangeText={setListText}
                  placeholder={'9782070360024\n9782203001237\n…'}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  minHeight={150}
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={12}
                  padding="$3"
                  fontFamily="$body"
                  fontSize={15}
                  color="$color"
                  placeholderTextColor="$concreteLight"
                  focusStyle={{ borderColor: '$accent' }}
                />
                <Button
                  onPress={() => void submitMany(isbnList)}
                  disabled={!!bulk || isbnList.length === 0}
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={12}
                  height={50}
                  fontFamily="$body"
                  fontWeight="600"
                  opacity={!!bulk || isbnList.length === 0 ? 0.6 : 1}
                >
                  {bulk
                    ? t('scan.importing', { done: bulk.done, total: bulk.total })
                    : isbnList.length > 1
                      ? t('scan.importNMany', { count: isbnList.length })
                      : t('scan.importNOne', { count: isbnList.length })}
                </Button>
              </>
            ) : (
              <>
                <Label>{t('scan.importCsvFile')}</Label>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={19}>
                  {t('scan.importCsvHint', {
                    action:
                      Platform.OS === 'web' ? t('scan.chooseFileVerb') : t('scan.pasteContentVerb'),
                  })}
                  {parsedCsv.books.length > 0
                    ? ` ${parsedCsv.books.length > 1 ? t('scan.csvDetectedMany', { count: parsedCsv.books.length }) : t('scan.csvDetectedOne', { count: parsedCsv.books.length })}${
                        parsedCsv.skipped > 0
                          ? parsedCsv.skipped > 1
                            ? t('scan.csvSkippedMany', { count: parsedCsv.skipped })
                            : t('scan.csvSkippedOne', { count: parsedCsv.skipped })
                          : ''
                      }.`
                    : ''}
                </Text>
                {Platform.OS === 'web' ? (
                  <Button
                    onPress={pickCsvFile}
                    backgroundColor="$backgroundStrong"
                    borderColor="$borderColor"
                    borderWidth={1}
                    color="$color"
                    borderRadius={12}
                    height={42}
                    fontFamily="$body"
                    fontWeight="600"
                  >
                    {t('scan.chooseCsvFile')}
                  </Button>
                ) : null}
                <TextArea
                  value={csvText}
                  onChangeText={setCsvText}
                  placeholder={'Title,Author,ISBN13,My Rating,Exclusive Shelf\n…'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  minHeight={120}
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={12}
                  padding="$3"
                  fontFamily="$body"
                  fontSize={13}
                  color="$color"
                  placeholderTextColor="$concreteLight"
                  focusStyle={{ borderColor: '$accent' }}
                />
                <Button
                  onPress={() => void csvImport.run(parsedCsv.books)}
                  disabled={!!csvImport.progress || parsedCsv.books.length === 0}
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={12}
                  height={50}
                  fontFamily="$body"
                  fontWeight="600"
                  opacity={!!csvImport.progress || parsedCsv.books.length === 0 ? 0.6 : 1}
                >
                  {csvImport.progress
                    ? t('scan.importing', {
                        done: csvImport.progress.done,
                        total: csvImport.progress.total,
                      })
                    : parsedCsv.books.length > 1
                      ? t('scan.importNMany', { count: parsedCsv.books.length })
                      : t('scan.importNOne', { count: parsedCsv.books.length })}
                </Button>
                {csvImport.result ? (
                  <Text fontFamily="$body" fontSize={13} color="$colorSoft">
                    {`${t('scan.importedCount', { added: csvImport.result.added })}${
                      csvImport.result.failed > 0
                        ? csvImport.result.failed > 1
                          ? t('scan.importFailedMany', { count: csvImport.result.failed })
                          : t('scan.importFailedOne', { count: csvImport.result.failed })
                        : ''
                    }.`}
                  </Text>
                ) : null}
              </>
            )}
          </YStack>
        ) : mode === 'search' ? (
          <SearchPanel onPick={(isbn) => void openAddSheet(isbn)} addedIsbns={addedIsbns} />
        ) : (
          <YStack gap="$4">
            {noCamera ? (
              <YStack
                gap="$1"
                padding="$3"
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
              >
                <Text fontFamily="$heading" fontSize={15} color="$color">
                  {t('scan.noCameraTitle')}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={19}>
                  {t('scan.noCameraBody')}
                </Text>
              </YStack>
            ) : (
              <BarcodeScanner
                onScan={(v) => void openAddSheet(v)}
                paused={!!pendingBook || lookup.isPending}
              />
            )}
            <YStack gap="$2">
              <Label>{t('scan.isbnEntryLabel')}</Label>
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
                  onPress={onSubmit}
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={12}
                  height={48}
                  paddingHorizontal="$5"
                  fontFamily="$body"
                  fontWeight="600"
                >
                  {t('scan.add')}
                </Button>
              </XStack>
            </YStack>
          </YStack>
        )}

        {entries.length > 0 ? (
          <YStack gap="$2" marginTop="$5">
            <Label>
              {addedCount > 1
                ? t('scan.sessionAddedMany', { count: addedCount })
                : t('scan.sessionAddedOne', { count: addedCount })}
            </Label>
            {entries.map((entry) => (
              <EntryRow
                key={entry.key}
                entry={entry}
                onRetry={() => retry(entry.key)}
                ownedBefore={entry.isbn13 ? (ownedAtOpen.current?.get(entry.isbn13) ?? 0) : 0}
              />
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
            borderRadius={12}
            height={52}
            fontFamily="$body"
            fontWeight="600"
            fontSize={16}
          >
            {addedCount > 1
              ? t('scan.finishMany', { count: addedCount })
              : t('scan.finishOne', { count: addedCount })}
          </Button>
        </YStack>
      ) : null}

      {lookup.isPending && !pendingBook ? (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="$4"
          backgroundColor="$backgroundStrong"
          borderTopColor="$borderColor"
          borderTopWidth={1}
          alignItems="center"
        >
          <XStack gap="$2" alignItems="center">
            <BookLoader size={30} />
            <Text fontFamily="$body" fontSize={14} color="$colorMuted">
              {t('scan.lookingUpBook')}
            </Text>
          </XStack>
        </YStack>
      ) : null}

      {resolveError ? (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="$4"
          backgroundColor="$backgroundStrong"
          borderTopColor="$borderColor"
          borderTopWidth={1}
        >
          <Text fontFamily="$body" fontSize={14} color="$signal" textAlign="center">
            {resolveError}
          </Text>
        </YStack>
      ) : null}

      {pendingBook ? (
        <AddSheet
          book={pendingBook}
          busy={committing}
          onConfirm={(opts) => void commitAdd(opts)}
          onCancel={() => setPendingBook(null)}
        />
      ) : null}
    </Screen>
  );
}

function EntryRow({
  entry,
  onRetry,
  ownedBefore = 0,
}: {
  entry: ScanEntry;
  onRetry: () => void;
  ownedBefore?: number;
}) {
  const { t } = useT();
  const { bg, fg } = composedPalette(entry.isbn13 ?? entry.key);
  const dup = entry.status === 'added' && ownedBefore > 0;
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
      {entry.status === 'added' && entry.book ? (
        <BookCover
          title={entry.book.title ?? t('scan.untitled')}
          author={entry.book.authors?.[0]}
          coverUrl={entry.book.cover_url}
          bg={bg}
          fg={fg}
          width={38}
        />
      ) : (
        <YStack width={38} height={57} alignItems="center" justifyContent="center">
          {entry.status === 'looking' ? (
            <BookLoader size={30} />
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
              {entry.book.title ?? t('scan.untitled')}
            </Text>
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
              {entry.book.authors?.[0] ?? entry.isbn13}
            </Text>
            {dup ? (
              <Text fontFamily="$body" fontSize={12} fontWeight="600" color={palette.ochre}>
                {t('scan.alreadyInLibrary')}
              </Text>
            ) : null}
          </>
        ) : entry.status === 'looking' ? (
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            {t('scan.looking', { ref: entry.isbn13 ?? entry.key })}
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
        <Button
          onPress={onRetry}
          chromeless
          height={32}
          color="$accent"
          fontFamily="$body"
          fontWeight="600"
        >
          {t('scan.retry')}
        </Button>
      ) : entry.status === 'added' ? (
        dup ? (
          <XStack
            backgroundColor={palette.ochre}
            borderRadius={999}
            paddingHorizontal={8}
            height={20}
            alignItems="center"
          >
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.paper}>
              {t('scan.alreadyTimes', { count: ownedBefore + 1 })}
            </Text>
          </XStack>
        ) : (
          <Text color="$positive" fontFamily="$body" fontSize={18}>
            ✓
          </Text>
        )
      ) : null}
    </XStack>
  );
}
