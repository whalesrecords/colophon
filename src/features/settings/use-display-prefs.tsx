import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

/**
 * Display modules the reader can switch on/off to tailor the app — from a stripped-
 * back "Épuré" (just catalogue + reading) to the full experience. Gates whole tabs
 * (Tendances, Échanges) and Profil/Accueil sections. Persisted in AsyncStorage.
 */
export type DisplayModule =
  | 'social' // Échanges tab: friends, circles, leaderboard, feed, challenges
  | 'gamification' // daily goal, streak, badges
  | 'discovery' // "Dans ton style" recos + taste profile
  | 'trends' // Tendances tab (community)
  | 'places' // carte / boîtes à livres
  | 'collection'; // prices, value, resale

export type DisplayPrefs = Record<DisplayModule, boolean>;

export const MODULES: { key: DisplayModule; label: string; hint: string }[] = [
  { key: 'social', label: 'Social', hint: 'Échanges : amis, cercles, classement, fil, défis' },
  { key: 'gamification', label: 'Objectifs & badges', hint: 'Objectif du jour, série, badges' },
  { key: 'discovery', label: 'Découverte', hint: 'Recommandations + profil de lecture' },
  { key: 'trends', label: 'Tendances', hint: 'Ce que lit la communauté' },
  { key: 'places', label: 'Lieux', hint: 'Carte des lieux + boîtes à livres' },
  { key: 'collection', label: 'Collection & valeur', hint: 'Prix payé, valeur, revente' },
];

const ALL = MODULES.map((m) => m.key);
const on = (keys: DisplayModule[]): DisplayPrefs =>
  Object.fromEntries(ALL.map((k) => [k, keys.includes(k)])) as DisplayPrefs;

export const PRESETS: { key: string; label: string; prefs: DisplayPrefs }[] = [
  { key: 'epure', label: 'Épuré', prefs: on([]) },
  { key: 'complet', label: 'Complet', prefs: on(ALL) },
  {
    key: 'collectionneur',
    label: 'Collectionneur',
    prefs: on(['discovery', 'places', 'collection']),
  },
  { key: 'social', label: 'Social', prefs: on(['social', 'gamification', 'discovery', 'trends']) },
];

const DEFAULT = on(ALL);
const KEY = 'colophon.displayPrefs.v1';

const Ctx = createContext<
  | {
      prefs: DisplayPrefs;
      setModule: (m: DisplayModule, v: boolean) => void;
      applyPreset: (p: DisplayPrefs) => void;
      matchedPreset: string | null;
    }
  | undefined
>(undefined);

export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT, ...(JSON.parse(raw) as Partial<DisplayPrefs>) });
      })
      .catch(() => {});
  }, []);

  const persist = (p: DisplayPrefs) => {
    setPrefs(p);
    AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
  };

  const matchedPreset = PRESETS.find((p) => ALL.every((k) => p.prefs[k] === prefs[k]))?.key ?? null;

  return (
    <Ctx.Provider
      value={{
        prefs,
        setModule: (m, v) => persist({ ...prefs, [m]: v }),
        applyPreset: persist,
        matchedPreset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDisplayPrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDisplayPrefs must be used within DisplayPrefsProvider');
  return c;
}
