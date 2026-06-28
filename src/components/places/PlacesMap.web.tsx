/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import { useUserPlaceActions, useUserPlaces } from '@/features/places/use-places';
import { palette } from '@/theme/tokens';

// Leaflet is loaded from a CDN at runtime (web only) so we don't bundle a DOM map
// lib into the native graph. 5 700+ points are clustered for performance.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CLUSTER_CSS = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
const CLUSTER_THEME =
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
const CLUSTER_JS = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';

const TYPES = [
  { key: 'librairie', label: 'Librairies', color: palette.brick },
  { key: 'festival', label: 'Festivals', color: palette.gold },
  { key: 'cafe_philo', label: 'Cafés philo', color: palette.prussian },
  { key: 'cercle_lecture', label: 'Cercles', color: palette.forest },
  { key: 'atelier_ecriture', label: 'Ateliers', color: '#6B5B95' },
] as const;
const COLOR: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.color]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));

// Librairie specialties (a librairie can have several, comma-separated).
const SPECIALTIES = [
  { key: 'manga', label: 'Manga / BD' },
  { key: 'jeunesse', label: 'Jeunesse' },
  { key: 'rencontres', label: 'Rencontres' },
  { key: 'editeur', label: 'Éditeurs' },
] as const;
const SPECIALTY_LABEL: Record<string, string> = Object.fromEntries(
  SPECIALTIES.map((s) => [s.key, s.label]),
);
const splitSpecialty = (s?: string): string[] =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

interface SelectedPlace {
  id: string;
  type: string;
  name: string;
  city?: string;
  postal_code?: string;
  website?: string;
  period?: string;
  specialty?: string;
  eventsUrl?: string;
  lat: number;
  lng: number;
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.addEventListener('load', () => {
      (s as any)._loaded = true;
      resolve();
    });
    s.addEventListener('error', () => reject(new Error(`load ${src}`)));
    document.head.appendChild(s);
  });
}

async function ensureLeaflet(): Promise<any> {
  loadCss(LEAFLET_CSS);
  loadCss(CLUSTER_CSS);
  loadCss(CLUSTER_THEME);
  await loadScript(LEAFLET_JS);
  await loadScript(CLUSTER_JS);
  return (window as any).L;
}

const open = (url: string) => window.open(url, '_blank', 'noopener');
const directionsUrl = (p: SelectedPlace) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
const mapsSearchUrl = (p: SelectedPlace) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [p.name, p.postal_code, p.city].filter(Boolean).join(' '),
  )}`;

function DetailSheet({
  place,
  mark,
  onToggle,
  onClose,
  signedIn,
}: {
  place: SelectedPlace;
  mark: { favorite: boolean; visited: boolean } | undefined;
  onToggle: (field: 'favorite' | 'visited') => void;
  onClose: () => void;
  signedIn: boolean;
}) {
  const color = COLOR[place.type] ?? palette.ink;
  const fav = mark?.favorite ?? false;
  const visited = mark?.visited ?? false;
  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="$background"
      borderTopLeftRadius={20}
      borderTopRightRadius={20}
      borderColor="$borderColor"
      borderWidth={1}
      padding="$4"
      gap="$3"
      {...({ style: { boxShadow: '0 -6px 24px rgba(0,0,0,0.14)', zIndex: 1000 } } as any)}
    >
      <XStack alignItems="flex-start" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <YStack width={10} height={10} borderRadius={999} backgroundColor={color} />
            <Text
              fontFamily="$body"
              fontSize={11}
              fontWeight="700"
              letterSpacing={1.4}
              textTransform="uppercase"
              color={color}
            >
              {TYPE_LABEL[place.type] ?? place.type}
            </Text>
          </XStack>
          <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
            {place.name}
          </Text>
          {place.city ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted">
              {[place.postal_code, place.city].filter(Boolean).join(' ')}
            </Text>
          ) : null}
          {place.period ? (
            <Text fontFamily="$body" fontSize={12.5} color="$colorSoft">
              {place.period}
            </Text>
          ) : null}
          {splitSpecialty(place.specialty).length > 0 ? (
            <XStack gap="$1.5" flexWrap="wrap" marginTop="$1">
              {splitSpecialty(place.specialty).map((s) => (
                <YStack
                  key={s}
                  paddingHorizontal="$2"
                  height={20}
                  borderRadius={999}
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  justifyContent="center"
                >
                  <Text fontFamily="$body" fontSize={11} fontWeight="600" color="$colorSoft">
                    {SPECIALTY_LABEL[s] ?? s}
                  </Text>
                </YStack>
              ))}
            </XStack>
          ) : null}
        </YStack>
        <Text
          onPress={onClose}
          fontFamily="$body"
          fontSize={15}
          fontWeight="600"
          color="$accent"
          paddingHorizontal="$2"
          {...({ style: { cursor: 'pointer' } } as any)}
        >
          Fermer
        </Text>
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        <Button
          onPress={() => open(directionsUrl(place))}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={42}
          paddingHorizontal="$4"
          fontFamily="$body"
          fontWeight="600"
          fontSize={14}
        >
          Y aller ↗
        </Button>
        {place.website ? (
          <Button
            onPress={() => open(place.website!)}
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            color="$color"
            borderRadius={12}
            height={42}
            paddingHorizontal="$4"
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
          >
            Site web ↗
          </Button>
        ) : null}
        <Button
          onPress={() => open(mapsSearchUrl(place))}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={42}
          paddingHorizontal="$4"
          fontFamily="$body"
          fontWeight="600"
          fontSize={14}
        >
          Horaires & avis ↗
        </Button>
        {place.eventsUrl ? (
          <Button
            onPress={() => open(place.eventsUrl!)}
            backgroundColor={palette.prussian}
            color={palette.paper}
            borderRadius={12}
            height={42}
            paddingHorizontal="$4"
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
          >
            Agenda des rencontres ↗
          </Button>
        ) : null}
      </XStack>

      {signedIn ? (
        <XStack gap="$2">
          <Button
            onPress={() => onToggle('favorite')}
            flex={1}
            backgroundColor={fav ? palette.brick : 'transparent'}
            borderColor={fav ? palette.brick : '$borderColor'}
            borderWidth={1}
            color={fav ? palette.paper : '$colorSoft'}
            borderRadius={12}
            height={44}
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
          >
            {fav ? '♥ Coup de cœur' : '♡ Coup de cœur'}
          </Button>
          <Button
            onPress={() => onToggle('visited')}
            flex={1}
            backgroundColor={visited ? palette.forest : 'transparent'}
            borderColor={visited ? palette.forest : '$borderColor'}
            borderWidth={1}
            color={visited ? palette.paper : '$colorSoft'}
            borderRadius={12}
            height={44}
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
          >
            {visited ? '✓ Visité' : 'Visité ?'}
          </Button>
        </XStack>
      ) : (
        <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
          Connectez-vous pour enregistrer vos coups de cœur et lieux visités.
        </Text>
      )}
    </YStack>
  );
}

export function PlacesMap() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: marks } = useUserPlaces(userId);
  const { toggle } = useUserPlaceActions(userId);

  const hostRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const featuresRef = useRef<any[]>([]);
  const layerRef = useRef<any>(null);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(TYPES.map((t) => [t.key, true])),
  );
  const [specialties, setSpecialties] = useState<Record<string, boolean>>({});
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const activeSpec = Object.keys(specialties).filter((k) => specialties[k]);
    const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    let n = 0;
    for (const f of featuresRef.current) {
      const p = f.properties;
      if (!active[p.type]) continue;
      // Specialty filter narrows librairies only (a place must match one selected spec).
      if (activeSpec.length > 0) {
        if (p.type !== 'librairie') continue;
        const specs = splitSpecialty(p.specialty);
        if (!activeSpec.some((s) => specs.includes(s))) continue;
      }
      const [lng, lat] = f.geometry.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
      const color = COLOR[p.type] ?? palette.ink;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #FBF6EC;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const m = L.marker([lat, lng], { icon });
      m.on('click', () =>
        setSelected({
          id: p.id,
          type: p.type,
          name: p.name || 'Lieu',
          city: p.city,
          postal_code: p.postal_code,
          website: p.website || undefined,
          period: p.period || undefined,
          specialty: p.specialty || undefined,
          eventsUrl: p.events_url || undefined,
          lat,
          lng,
        }),
      );
      cluster.addLayer(m);
      n += 1;
    }
    map.addLayer(cluster);
    layerRef.current = cluster;
    setCount(n);
  }, [active, specialties]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const L = await ensureLeaflet();
        if (cancelled || !hostRef.current || mapRef.current) return;
        LRef.current = L;
        const map = L.map(hostRef.current, { scrollWheelZoom: true }).setView([46.6, 2.4], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        const res = await fetch('/lieux.geojson');
        const data = await res.json();
        featuresRef.current = data.features ?? [];
        render();
      } catch {
        setError('Carte indisponible pour le moment.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <YStack flex={1}>
      <XStack
        gap="$2"
        flexWrap="wrap"
        paddingHorizontal="$3"
        paddingVertical="$2"
        backgroundColor="$background"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
        alignItems="center"
      >
        {TYPES.map((t) => {
          const on = active[t.key];
          return (
            <XStack
              key={t.key}
              onPress={() => setActive((a) => ({ ...a, [t.key]: !a[t.key] }))}
              alignItems="center"
              gap="$1.5"
              paddingHorizontal="$2.5"
              height={30}
              borderRadius={999}
              borderWidth={1}
              borderColor={on ? t.color : '$borderColor'}
              backgroundColor={on ? t.color : 'transparent'}
              {...({ style: { cursor: 'pointer' } } as any)}
            >
              <YStack
                width={8}
                height={8}
                borderRadius={999}
                backgroundColor={on ? palette.paper : t.color}
              />
              <Text
                fontFamily="$body"
                fontSize={12.5}
                fontWeight="600"
                color={on ? palette.paper : '$colorSoft'}
              >
                {t.label}
              </Text>
            </XStack>
          );
        })}
        <Text fontFamily="$body" fontSize={12} color="$colorMuted" marginLeft="auto">
          {count.toLocaleString('fr-FR')} lieux
        </Text>
      </XStack>

      <XStack
        gap="$2"
        flexWrap="wrap"
        paddingHorizontal="$3"
        paddingVertical="$1.5"
        backgroundColor="$background"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
        alignItems="center"
      >
        <Text fontFamily="$body" fontSize={11.5} color="$colorMuted">
          Librairies :
        </Text>
        {SPECIALTIES.map((s) => {
          const on = specialties[s.key];
          return (
            <XStack
              key={s.key}
              onPress={() => setSpecialties((m) => ({ ...m, [s.key]: !m[s.key] }))}
              alignItems="center"
              paddingHorizontal="$2.5"
              height={26}
              borderRadius={999}
              borderWidth={1}
              borderColor={on ? palette.brick : '$borderColor'}
              backgroundColor={on ? palette.brick : 'transparent'}
              {...({ style: { cursor: 'pointer' } } as any)}
            >
              <Text
                fontFamily="$body"
                fontSize={12}
                fontWeight="600"
                color={on ? palette.paper : '$colorSoft'}
              >
                {s.label}
              </Text>
            </XStack>
          );
        })}
      </XStack>

      <YStack flex={1} position="relative">
        {error ? (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
            {...({ style: { zIndex: 500 } } as any)}
          >
            <Text fontFamily="$body" color="$colorMuted">
              {error}
            </Text>
          </YStack>
        ) : null}

        {/* Real DOM node Leaflet mounts into (web build uses react-dom). */}
        <div ref={hostRef as any} style={{ flexGrow: 1, width: '100%', minHeight: 300 }} />

        {selected ? (
          <DetailSheet
            place={selected}
            mark={marks?.get(selected.id)}
            signedIn={!!userId}
            onToggle={(field) => toggle.mutate({ place: selected, field })}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </YStack>
    </YStack>
  );
}
