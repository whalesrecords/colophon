import { Button, XStack } from 'tamagui';

import { palette } from '@/theme/tokens';

/**
 * Segmented control — one rounded container, the active segment filled espresso.
 * The unified "tabs" control from the refonte (Scan modes, import sub-tabs…).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <XStack
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={12}
      padding={4}
      gap={4}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Button
            key={o.value}
            onPress={() => onChange(o.value)}
            flex={1}
            height={38}
            paddingHorizontal={0}
            borderRadius={9}
            borderWidth={0}
            backgroundColor={active ? '$accent' : 'transparent'}
            color={active ? palette.paper : '$colorMuted'}
            fontFamily="$body"
            fontWeight="600"
            fontSize={13}
            pressStyle={{ opacity: 0.85 }}
          >
            {o.label}
          </Button>
        );
      })}
    </XStack>
  );
}
