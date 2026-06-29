import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { useUnreadCounts } from '@/features/circles/use-circles';
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

// Web only: the browser draws a focus ring (an ochre box here) around the active
// tab after a click. Strip it so the tab bar stays clean.
function useStripTabFocusRing() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent =
      '[role="tablist"] [role="tab"]:focus,[role="tablist"] [role="tab"]:focus-visible,' +
      '[role="tablist"] a:focus,[role="tablist"] a:focus-visible,' +
      '[role="tablist"] button:focus,[role="tablist"] button:focus-visible' +
      '{outline:none!important;box-shadow:none!important;}';
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  useStripTabFocusRing();
  const { t } = useT();
  const { effective } = useThemePref();
  const { session } = useAuth();
  const { data: unread } = useUnreadCounts(session?.user.id);
  const totalUnread = unread ? [...unread.values()].reduce((a, b) => a + b, 0) : 0;
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
          // Android/web: add the gesture-nav / nav-bar inset so labels clear the
          // system bar. Tall enough that the 11px label (descenders incl.) isn't clipped.
          height: Platform.select({ ios: 86, default: 76 + insets.bottom }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 28, default: 18 + insets.bottom }),
        },
        tabBarLabelStyle: {
          fontFamily: 'SchibstedGrotesk_500Medium',
          fontSize: 11,
          lineHeight: 14,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.library'), tabBarIcon: tabIcon('library') }}
      />
      <Tabs.Screen
        name="trends"
        options={{ title: t('tabs.trends'), tabBarIcon: tabIcon('trends') }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.scan'),
          tabBarIcon: ScanTabIcon,
          tabBarLabelStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="discussions"
        options={{
          title: t('tabs.exchanges'),
          tabBarIcon: tabIcon('discussions'),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.terracotta, color: palette.paper },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('profile') }}
      />
    </Tabs>
  );
}
