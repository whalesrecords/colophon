import { YStack } from 'tamagui';

/** A 9px status dot (the unified size from the refonte). */
export function StatusDot({ color }: { color: string }) {
  return <YStack width={9} height={9} borderRadius={999} backgroundColor={color} />;
}
