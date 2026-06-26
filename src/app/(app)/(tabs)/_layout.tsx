import { Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { useT } from '@/i18n';
import { useThemePref } from '@/theme/theme-pref';
import { palette } from '@/theme/tokens';

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={String(color)} size={24} />;
  };
}

// Central scan action: a filled aizome circle.
function ScanTabIcon() {
  return (
    <View
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: palette.aizome,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Platform.select({ ios: -4, default: -8 }),
      }}
    >
      <Icon name="scan" color={palette.paper} size={24} />
    </View>
  );
}

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { effective } = useThemePref();
  const dark = effective === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? '#5E76A8' : palette.aizome,
        tabBarInactiveTintColor: dark ? '#6E685E' : palette.concrete,
        tabBarStyle: {
          backgroundColor: dark ? 'rgba(21,19,14,0.96)' : 'rgba(244,241,234,0.96)',
          borderTopColor: dark ? '#332F26' : palette.hairline,
          // Android: add the gesture-nav / nav-bar inset so labels clear the system bar.
          height: Platform.select({ ios: 86, default: 60 + insets.bottom }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 28, default: 8 + insets.bottom }),
        },
        tabBarLabelStyle: { fontFamily: 'SchibstedGrotesk_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.library'), tabBarIcon: tabIcon('library') }}
      />
      <Tabs.Screen name="trends" options={{ title: t('tabs.trends'), tabBarIcon: tabIcon('trends') }} />
      <Tabs.Screen
        name="scan"
        options={{ title: t('tabs.scan'), tabBarIcon: ScanTabIcon, tabBarLabelStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="discussions"
        options={{ title: t('tabs.exchanges'), tabBarIcon: tabIcon('discussions') }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('profile') }} />
    </Tabs>
  );
}
