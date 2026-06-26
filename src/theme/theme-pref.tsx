import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePref = 'system' | 'light' | 'dark';
export type ThemeScheme = 'light' | 'dark';

const STORAGE_KEY = 'colophon.theme';

/** Dark surface used where a concrete color is needed (status bar, nav background). */
export const DARK_BG = '#15130E';

export const THEME_OPTIONS: ThemePref[] = ['system', 'light', 'dark'];

interface ThemePrefValue {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  effective: ThemeScheme;
}

const ThemePrefContext = createContext<ThemePrefValue | null>(null);

export function ThemePrefProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'system' || v === 'light' || v === 'dark') setPrefState(v);
      })
      .catch(() => undefined);
  }, []);

  const setPref = (next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  };

  const effective: ThemeScheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

  const value = useMemo(() => ({ pref, setPref, effective }), [pref, effective]);
  return <ThemePrefContext.Provider value={value}>{children}</ThemePrefContext.Provider>;
}

export function useThemePref(): ThemePrefValue {
  const ctx = useContext(ThemePrefContext);
  if (!ctx) throw new Error('useThemePref must be used within a ThemePrefProvider');
  return ctx;
}
