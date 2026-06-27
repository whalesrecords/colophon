import { Stack } from 'expo-router';

import { palette } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="circle/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="upcoming" options={{ presentation: 'card' }} />
    </Stack>
  );
}
