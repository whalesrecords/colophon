import { Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.aizome,
        tabBarInactiveTintColor: palette.concrete,
        tabBarStyle: {
          backgroundColor: 'rgba(244,241,234,0.96)',
          borderTopColor: palette.hairline,
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
        options={{ title: 'Bibliothèque', tabBarIcon: tabIcon('library') }}
      />
      <Tabs.Screen name="trends" options={{ title: 'Tendances', tabBarIcon: tabIcon('trends') }} />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan', tabBarIcon: ScanTabIcon, tabBarLabelStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="discussions"
        options={{ title: 'Échanges', tabBarIcon: tabIcon('discussions') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: tabIcon('profile') }} />
    </Tabs>
  );
}
