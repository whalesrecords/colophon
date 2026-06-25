import { Text, YStack } from 'tamagui';

import { Screen } from './Screen';

/** Placeholder for screens whose full build lands in a later phase. */
export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Screen>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" paddingHorizontal="$8">
        <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
          {title}
        </Text>
        <Text
          fontFamily="$body"
          fontSize={15}
          color="$colorMuted"
          textAlign="center"
          lineHeight={22}
        >
          {subtitle}
        </Text>
      </YStack>
    </Screen>
  );
}
