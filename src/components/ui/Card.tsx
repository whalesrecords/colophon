import { YStack, type YStackProps } from 'tamagui';

/**
 * The unified card surface from the refonte: cream (`$backgroundStrong` → paperCard
 * in light), 1px hairline border, radius 16, padding 16. Theme-aware so it adapts
 * in dark mode. Override any prop as needed.
 */
export function Card({ children, ...props }: YStackProps) {
  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={16}
      padding={16}
      {...props}
    >
      {children}
    </YStack>
  );
}
