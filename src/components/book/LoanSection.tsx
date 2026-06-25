import { useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { useLoanActions, useLoans } from '@/features/loans/use-loans';
import { palette } from '@/theme/tokens';

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

const inputProps = {
  placeholderTextColor: '$concreteLight' as const,
  backgroundColor: '$background' as const,
  borderColor: '$borderColor' as const,
  borderWidth: 1,
  borderRadius: 2,
  height: 44,
  paddingHorizontal: '$3' as const,
  fontFamily: '$body' as const,
  fontSize: 15,
  color: '$color' as const,
};

export function LoanSection({ itemId, userId }: { itemId: string; userId: string | undefined }) {
  const { data: loans } = useLoans(itemId);
  const { lend, markReturned, remove } = useLoanActions(itemId, userId);
  const active = loans?.find((l) => !l.returned_on);
  const past = (loans ?? []).filter((l) => l.returned_on);
  const [borrower, setBorrower] = useState('');
  const [dueOn, setDueOn] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);

  const onLend = async () => {
    const name = borrower.trim();
    if (!name) return;
    setBorrower('');
    setDueOn('');
    try {
      await lend.mutateAsync({ borrower: name, dueOn: dueOn.trim() || null });
    } catch {
      // ignore
    }
  };

  return (
    <YStack gap="$3">
      <Label>Prêt</Label>

      {active ? (
        <YStack
          gap="$2"
          padding="$3"
          borderRadius={2}
          borderWidth={1}
          borderColor={palette.ochre}
          backgroundColor="$backgroundStrong"
        >
          <Text fontFamily="$heading" fontSize={17} color="$color">
            {`Prêté à ${active.borrower}`}
          </Text>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            {`Depuis le ${active.lent_on}`}
            {active.due_on ? ` · à rendre le ${active.due_on}` : ''}
          </Text>
          {active.due_on && active.due_on < todayStr ? (
            <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$signal">
              En retard
            </Text>
          ) : null}
          <XStack gap="$2" marginTop="$1">
            <Button
              onPress={() => markReturned.mutate(active.id)}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={2}
              height={42}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
            >
              Marquer rendu
            </Button>
            <Button
              onPress={() => remove.mutate(active.id)}
              chromeless
              height={42}
              paddingHorizontal="$2"
              color="$colorMuted"
              fontFamily="$body"
            >
              Annuler le prêt
            </Button>
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$2">
          <Input
            {...inputProps}
            value={borrower}
            onChangeText={setBorrower}
            onSubmitEditing={onLend}
            placeholder="Prêté à… (nom)"
          />
          <XStack gap="$2">
            <Input
              flex={1}
              {...inputProps}
              value={dueOn}
              onChangeText={setDueOn}
              autoCapitalize="none"
              placeholder="Retour prévu (AAAA-MM-JJ)"
            />
            <Button
              onPress={onLend}
              disabled={lend.isPending}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={2}
              height={44}
              paddingHorizontal="$5"
              fontFamily="$body"
              fontWeight="600"
            >
              Prêter
            </Button>
          </XStack>
        </YStack>
      )}

      {past.length > 0 ? (
        <YStack gap="$1">
          {past.map((l) => (
            <XStack
              key={l.id}
              alignItems="center"
              gap="$2"
              paddingVertical="$1"
              borderBottomColor="$borderColor"
              borderBottomWidth={1}
            >
              <Text flex={1} fontFamily="$body" fontSize={13} color="$colorSoft">
                {`Rendu · ${l.borrower} · ${l.lent_on} → ${l.returned_on}`}
              </Text>
              <Button
                onPress={() => remove.mutate(l.id)}
                chromeless
                height={28}
                paddingHorizontal="$2"
                color="$colorMuted"
                fontFamily="$body"
                fontSize={16}
              >
                ✕
              </Button>
            </XStack>
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}
