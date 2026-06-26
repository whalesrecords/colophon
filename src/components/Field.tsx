import type { ReactNode } from 'react';
import { Input, type InputProps, Text, YStack } from 'tamagui';

/** A form field: an uppercase label above its control. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <YStack gap="$2">
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="600"
        letterSpacing={2.2}
        textTransform="uppercase"
        color="$colorMuted"
      >
        {label}
      </Text>
      {children}
    </YStack>
  );
}

/** Labeled text input styled to the Colophon "filet" field treatment. */
export function TextField({ label, ...props }: { label: string } & InputProps) {
  return (
    <Field label={label}>
      <Input
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={12}
        height={50}
        paddingHorizontal="$3"
        fontFamily="$body"
        fontSize={15}
        color="$color"
        placeholderTextColor="$concreteLight"
        focusStyle={{ borderColor: '$accent' }}
        {...props}
      />
    </Field>
  );
}
