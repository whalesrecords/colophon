import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
} from '@expo-google-fonts/schibsted-grotesk';
import {
  Spectral_400Regular,
  Spectral_400Regular_Italic,
  Spectral_500Medium,
  Spectral_600SemiBold,
} from '@expo-google-fonts/spectral';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { usePushRegistration } from '@/features/notifications/use-push-registration';
import { LocaleProvider } from '@/i18n';
import { DARK_BG, ThemePrefProvider, useThemePref } from '@/theme/theme-pref';
import { palette } from '@/theme/tokens';
import config from '@/theme/tamagui.config';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function RootNavigator() {
  const { session, initializing } = useAuth();
  const { effective } = useThemePref();
  usePushRegistration(session?.user.id);
  if (initializing) return null;
  const signedIn = !!session;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: effective === 'dark' ? DARK_BG : palette.paper },
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* Public read-only shared library/shelf — accessible without auth. */}
      <Stack.Screen name="s/[token]" />
      {/* Public privacy policy + support (App Store / Google Play requirement). */}
      <Stack.Screen name="privacy" />
      <Stack.Screen name="support" />
      {/* Public password-reset landing (email recovery link → set new password). */}
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    Spectral_500Medium,
    Spectral_600SemiBold,
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemePrefProvider>
        <ThemedApp />
      </ThemePrefProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { effective } = useThemePref();
  return (
    <TamaguiProvider config={config} defaultTheme={effective}>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <StatusBar style={effective === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
