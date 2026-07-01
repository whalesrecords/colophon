import { Alert, Platform, ScrollView } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { BackLink } from '@/components/ui';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { useAuth } from '@/features/auth/auth-context';
import { useOnboarding } from '@/features/onboarding/OnboardingTour';
import { MODULES, PRESETS, useDisplayPrefs } from '@/features/settings/use-display-prefs';
import { LOCALES, useT } from '@/i18n';
import { THEME_OPTIONS, useThemePref } from '@/theme/theme-pref';
import { palette } from '@/theme/tokens';

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.8}
      textTransform="uppercase"
      color="$color"
    >
      {children}
    </Text>
  );
}

function ModuleToggle({ mod }: { mod: (typeof MODULES)[number] }) {
  const { prefs, setModule } = useDisplayPrefs();
  const on = prefs[mod.key];
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$2"
      onPress={() => setModule(mod.key, !on)}
      pressStyle={{ opacity: 0.7 }}
      cursor="pointer"
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={mod.label}
    >
      <YStack flex={1} gap={1} paddingRight="$3">
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$color">
          {mod.label}
        </Text>
        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
          {mod.hint}
        </Text>
      </YStack>
      <YStack
        width={46}
        height={28}
        borderRadius={999}
        padding={3}
        backgroundColor={on ? '$accent' : '$borderColor'}
      >
        <YStack
          width={22}
          height={22}
          borderRadius={999}
          backgroundColor={palette.paper}
          alignSelf={on ? 'flex-end' : 'flex-start'}
        />
      </YStack>
    </XStack>
  );
}

function DisplaySection() {
  const { applyPreset, matchedPreset } = useDisplayPrefs();
  return (
    <YStack gap="$3" marginTop="$6">
      <Label>Affichage</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorSoft" lineHeight={18}>
        Choisis ce que l’app affiche. « Épuré » ne garde que le catalogue et la lecture ; tu peux
        aussi régler chaque module à la main.
      </Text>
      <XStack gap="$2" flexWrap="wrap">
        {PRESETS.map((p) => {
          const active = matchedPreset === p.key;
          return (
            <Button
              key={p.key}
              onPress={() => applyPreset(p.prefs)}
              height={40}
              paddingHorizontal="$4"
              borderRadius={999}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$color'}
              fontFamily="$body"
              fontWeight="600"
              fontSize={14}
              pressStyle={{ opacity: 0.85 }}
            >
              {p.label}
            </Button>
          );
        })}
      </XStack>
      <YStack marginTop="$1">
        {MODULES.map((m) => (
          <ModuleToggle key={m.key} mod={m} />
        ))}
      </YStack>
    </YStack>
  );
}

function AppearanceSection() {
  const { t } = useT();
  const { pref, setPref } = useThemePref();
  return (
    <YStack gap="$2" marginTop="$6">
      <Label>{t('settings.appearance')}</Label>
      <XStack gap="$2">
        {THEME_OPTIONS.map((opt) => {
          const active = opt === pref;
          return (
            <Button
              key={opt}
              onPress={() => setPref(opt)}
              flex={1}
              height={44}
              borderRadius={12}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$color'}
              fontFamily="$body"
              fontWeight="600"
              fontSize={14}
              pressStyle={{ opacity: 0.85 }}
            >
              {t(`theme.${opt}`)}
            </Button>
          );
        })}
      </XStack>
    </YStack>
  );
}

function LanguageSection() {
  const { locale, setLocale, t } = useT();
  return (
    <YStack gap="$2" marginTop="$6">
      <Label>{t('settings.language')}</Label>
      <XStack gap="$2">
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <Button
              key={l.code}
              onPress={() => setLocale(l.code)}
              flex={1}
              height={44}
              borderRadius={12}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$color'}
              fontFamily="$body"
              fontWeight="600"
              pressStyle={{ opacity: 0.85 }}
            >
              {l.label}
            </Button>
          );
        })}
      </XStack>
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
        {t('settings.languageHint')}
      </Text>
    </YStack>
  );
}

function DangerZone({ onSignedOut }: { onSignedOut: () => void }) {
  const deleteAccount = useDeleteAccount();
  const { t } = useT();

  const confirmDelete = () => {
    const proceed = async () => {
      try {
        await deleteAccount.mutateAsync();
        onSignedOut();
      } catch {
        // error surfaced below
      }
    };
    const message = t('profile.deleteConfirmBody');
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`${message}\n\n${t('profile.deleteConfirmAsk')}`)
      ) {
        void proceed();
      }
    } else {
      Alert.alert(t('profile.deleteConfirmTitle'), message, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => void proceed() },
      ]);
    }
  };

  return (
    <YStack gap="$2" marginTop="$8">
      <Label>{t('profile.account')}</Label>
      <Button
        onPress={confirmDelete}
        disabled={deleteAccount.isPending}
        backgroundColor="transparent"
        borderColor="$signal"
        borderWidth={1}
        color="$signal"
        borderRadius={12}
        height={46}
        fontFamily="$body"
        fontWeight="600"
        pressStyle={{ opacity: 0.85 }}
      >
        {deleteAccount.isPending ? t('profile.deleting') : t('profile.deleteAccount')}
      </Button>
      {deleteAccount.isError ? (
        <Text fontFamily="$body" fontSize={13} color="$signal">
          {(deleteAccount.error as Error).message}
        </Text>
      ) : null}
    </YStack>
  );
}

/** Réglages — reached from the gear in the Profil header. Holds the app preferences
 *  (affichage/modules, thème, langue) and the account actions, moved off the Profil
 *  tab so it stays a reading dashboard. */
export default function SettingsScreen() {
  const { t } = useT();
  const { signOut } = useAuth();
  const { replay: replayTour } = useOnboarding();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 }}
      >
        <BackLink label="Profil" fallback="/profile" />
        <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color" marginTop="$2">
          {t('settings.title')}
        </Text>

        <DisplaySection />
        <AppearanceSection />
        <LanguageSection />

        <Button
          marginTop="$6"
          onPress={replayTour}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={48}
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.85 }}
        >
          Revoir le tutoriel
        </Button>

        <Button
          marginTop="$3"
          onPress={signOut}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={48}
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.85 }}
        >
          {t('profile.signOut')}
        </Button>

        <DangerZone onSignedOut={signOut} />
      </ScrollView>
    </Screen>
  );
}
