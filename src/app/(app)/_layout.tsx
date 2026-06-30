import { Stack } from 'expo-router';

import { OnboardingProvider } from '@/features/onboarding/OnboardingTour';
import { DisplayPrefsProvider } from '@/features/settings/use-display-prefs';
import { palette } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <DisplayPrefsProvider>
      <OnboardingProvider>
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
          <Stack.Screen name="queue" options={{ presentation: 'card' }} />
          <Stack.Screen name="session" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="readers" options={{ presentation: 'card' }} />
          <Stack.Screen name="u/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </OnboardingProvider>
    </DisplayPrefsProvider>
  );
}
