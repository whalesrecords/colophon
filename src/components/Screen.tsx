import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, type YStackProps } from 'tamagui';

interface ScreenProps extends YStackProps {
  children: ReactNode;
  /** Apply the top safe-area inset as padding (default true). */
  safeTop?: boolean;
}

/** Full-bleed paper screen with safe-area top padding. */
export function Screen({ children, safeTop = true, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={safeTop ? insets.top : 0} {...props}>
      {children}
    </YStack>
  );
}
