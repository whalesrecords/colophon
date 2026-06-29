/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Text, TextArea, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import { boxPhotoUrl, useBookBoxes } from '@/features/places/use-book-boxes';
import { useUserPlaceActions, useUserPlaces } from '@/features/places/use-places';
import { palette } from '@/theme/tokens';

/** Escape user-provided text before putting it in a Leaflet popup's innerHTML. */
function esc(s?: string | null): string {
  return (s || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

// Leaflet is loaded from a CDN at runtime (web only) so we don't bundle a DOM map
// lib into the native graph. 5 700+ points are clustered for performance.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CLUSTER_CSS = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
const CLUSTER_THEME =
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
const CLUSTER_JS = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';

// A glyph per type gives a non-colour cue (accessibility — types aren't told apart
// by colour alone) and makes markers legible on the map.
const TYPES = [
  { key: 'librairie', label: 'Librairies', color: palette.brick, glyph: '📚' },
  { key: 'festival', label: 'Festivals', color: palette.gold, glyph: '🎪' },
  { key: 'cafe_philo', label: 'Cafés philo', color: palette.prussian, glyph: '☕' },
  { key: 'cercle_lecture', label: 'Cercles', color: palette.forest, glyph: '👥' },
  { key: 'atelier_ecriture', label: 'Ateliers', color: palette.concrete, glyph: '✍️' },
] as const;
const COLOR: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.color]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));
const GLYPH: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.glyph]));

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
  onSaveNote,
  onClose,
  signedIn,
}: {
  place: SelectedPlace;
  mark: { favorite: boolean; visited: boolean; note: string | null } | undefined;
  onToggle: (field: 'favorite' | 'visited') => void;
  onSaveNote: (note: string) => void;
  onClose: () => void;
  signedIn: boolean;
}) {
  const color = COLOR[place.type] ?? palette.ink;
  const fav = mark?.favorite ?? false;
  const visited = mark?.visited ?? false;
  const note = mark?.note ?? '';
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(note);
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
          <XStack alignItems="center" gap="$1.5">
            <Text fontSize={13} lineHeight={15}>
              {GLYPH[place.type] ?? '•'}
            </Text>
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
        <YStack gap="$2">
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

          {editingNote ? (
            <YStack gap="$2">
              <TextArea
                value={draft}
                onChangeText={setDraft}
                placeholder="Votre anecdote sur ce lieu…"
                placeholderTextColor="$concreteLight"
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={10}
                minHeight={66}
                padding="$2"
                fontFamily="$body"
                fontSize={14}
                color="$color"
              />
              <XStack gap="$2">
                <Button
                  onPress={() => {
                    onSaveNote(draft);
                    setEditingNote(false);
                  }}
                  backgroundColor="$accent"
                  color={palette.paper}
                  borderRadius={10}
                  height={36}
                  paddingHorizontal="$4"
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={13}
                >
                  Enregistrer
                </Button>
                <Button
                  onPress={() => {
                    setDraft(note);
                    setEditingNote(false);
                  }}
                  chromeless
                  height={36}
                  color="$colorMuted"
                  fontFamily="$body"
                  fontSize={13}
                >
                  Annuler
                </Button>
              </XStack>
            </YStack>
          ) : note ? (
            <YStack gap="$1">
              <Text
                fontFamily="$body"
                fontSize={13.5}
                color="$colorSoft"
                lineHeight={19}
                fontStyle="italic"
              >
                « {note} »
              </Text>
              <Text
                onPress={() => setEditingNote(true)}
                fontFamily="$body"
                fontSize={13}
                fontWeight="600"
                color="$accent"
                {...({ style: { cursor: 'pointer' } } as any)}
              >
                Modifier l’anecdote
              </Text>
            </YStack>
          ) : (
            <Text
              onPress={() => setEditingNote(true)}
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
              color="$accent"
              {...({ style: { cursor: 'pointer' } } as any)}
            >
              + Ajouter une anecdote
            </Text>
          )}
        </YStack>
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
  const { toggle, setNote } = useUserPlaceActions(userId);
  const { data: boxes } = useBookBoxes();

  const hostRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const featuresRef = useRef<any[]>([]);
  const layerRef = useRef<any>(null);
  const boxesLayerRef = useRef<any>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(TYPES.map((t) => [t.key, true])),
  );
  const [specialties, setSpecialties] = useState<Record<string, boolean>>({});
  const [mineFav, setMineFav] = useState(false);
  const [mineVisited, setMineVisited] = useState(false);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const activeSpec = Object.keys(specialties).filter((k) => specialties[k]);
    const mineOnly = mineFav || mineVisited;
    // Warm-pastille cluster bubbles (refonte) — green → ochre → orange by size.
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      iconCreateFunction: (c: any) => {
        const n = c.getChildCount();
        const size = n < 10 ? 34 : n < 100 ? 40 : 48;
        const bg = n < 10 ? '#5FA85C' : n < 100 ? '#E0A24B' : '#E08A4B';
        return L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid rgba(255,255,255,.75);box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-family:sans-serif;font-size:13px">${n}</div>`,
          iconSize: [size, size],
        });
      },
    });
    let n = 0;
    for (const f of featuresRef.current) {
      const p = f.properties;
      if (!active[p.type]) continue;
      // "Mes lieux" filter — only my coups de cœur / visités.
      if (mineOnly) {
        const mk = marks?.get(p.id);
        if (!mk) continue;
        if (!((mineFav && mk.favorite) || (mineVisited && mk.visited))) continue;
      }
      // Specialty filter narrows librairies only (a place must match one selected spec).
      if (activeSpec.length > 0) {
        if (p.type !== 'librairie') continue;
        const specs = splitSpecialty(p.specialty);
        if (!activeSpec.some((s) => specs.includes(s))) continue;
      }
      const [lng, lat] = f.geometry.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
      const color = COLOR[p.type] ?? palette.ink;
      const glyph = GLYPH[p.type] ?? '•';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#FBF6EC;border:2px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1">${glyph}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
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

    // Boîtes à livres — a separate (un-clustered) layer of square gold markers, so
    // they read as "boxes" (vs the round place pins) and stay visible at any zoom.
    if (boxesLayerRef.current) map.removeLayer(boxesLayerRef.current);
    boxesLayerRef.current = null;
    if (showBoxes && boxes && boxes.length > 0) {
      const bl = L.layerGroup();
      for (const b of boxes) {
        if (typeof b.lat !== 'number' || typeof b.lng !== 'number') continue;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:6px;background:${palette.gold};border:2px solid rgba(255,255,255,.85);box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1">📚</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const photo = boxPhotoUrl(b.photo_path);
        const dir = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
        const html = `<div style="font:13px/1.4 -apple-system,sans-serif;max-width:200px">${
          photo
            ? `<img src="${esc(photo)}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px"/>`
            : ''
        }<strong>${esc(b.name)}</strong>${
          b.city ? `<div style="color:#8C8479">${esc(b.city)}</div>` : ''
        }${b.note ? `<div style="margin-top:4px">${esc(b.note)}</div>` : ''}<a href="${dir}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;color:#AE4133;font-weight:600">Y aller ↗</a></div>`;
        L.marker([b.lat, b.lng], { icon }).bindPopup(html).addTo(bl);
      }
      bl.addTo(map);
      boxesLayerRef.current = bl;
    }
  }, [active, specialties, marks, mineFav, mineVisited, boxes, showBoxes]);

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
              <Text fontSize={12} lineHeight={14}>
                {t.glyph}
              </Text>
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
        <XStack
          onPress={() => setShowBoxes((v) => !v)}
          alignItems="center"
          gap="$1.5"
          paddingHorizontal="$2.5"
          height={30}
          borderRadius={999}
          borderWidth={1}
          borderColor={showBoxes ? palette.gold : '$borderColor'}
          backgroundColor={showBoxes ? palette.gold : 'transparent'}
          {...({ style: { cursor: 'pointer' } } as any)}
        >
          <Text fontSize={12} lineHeight={14}>
            📚
          </Text>
          <Text
            fontFamily="$body"
            fontSize={12.5}
            fontWeight="600"
            color={showBoxes ? palette.paper : '$colorSoft'}
          >
            Boîtes à livres
          </Text>
        </XStack>
        {userId ? (
          <XStack gap="$2" marginLeft="$2" alignItems="center">
            <XStack
              onPress={() => setMineFav((v) => !v)}
              alignItems="center"
              gap="$1.5"
              paddingHorizontal="$2.5"
              height={30}
              borderRadius={999}
              borderWidth={1}
              borderColor={mineFav ? palette.brick : '$borderColor'}
              backgroundColor={mineFav ? palette.brick : 'transparent'}
              {...({ style: { cursor: 'pointer' } } as any)}
            >
              <Text
                fontFamily="$body"
                fontSize={12.5}
                fontWeight="600"
                color={mineFav ? palette.paper : '$colorSoft'}
              >
                ♥ Coups de cœur
              </Text>
            </XStack>
            <XStack
              onPress={() => setMineVisited((v) => !v)}
              alignItems="center"
              gap="$1.5"
              paddingHorizontal="$2.5"
              height={30}
              borderRadius={999}
              borderWidth={1}
              borderColor={mineVisited ? palette.forest : '$borderColor'}
              backgroundColor={mineVisited ? palette.forest : 'transparent'}
              {...({ style: { cursor: 'pointer' } } as any)}
            >
              <Text
                fontFamily="$body"
                fontSize={12.5}
                fontWeight="600"
                color={mineVisited ? palette.paper : '$colorSoft'}
              >
                ✓ Visités
              </Text>
            </XStack>
          </XStack>
        ) : null}
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

        {!error && (mineFav || mineVisited) && count === 0 ? (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$6"
            {...({ style: { zIndex: 500, pointerEvents: 'none' } } as any)}
          >
            <YStack
              backgroundColor="$background"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={14}
              padding="$4"
              maxWidth={320}
            >
              <Text
                fontFamily="$body"
                fontSize={14}
                color="$colorSoft"
                textAlign="center"
                lineHeight={20}
              >
                Aucun lieu ici dans votre sélection. Touchez un lieu sur la carte pour l’ajouter à
                vos coups de cœur ou aux lieux visités.
              </Text>
            </YStack>
          </YStack>
        ) : null}

        {/* Real DOM node Leaflet mounts into (web build uses react-dom). */}
        <div ref={hostRef as any} style={{ flexGrow: 1, width: '100%', minHeight: 300 }} />

        {selected ? (
          <DetailSheet
            key={selected.id}
            place={selected}
            mark={marks?.get(selected.id)}
            signedIn={!!userId}
            onToggle={(field) => toggle.mutate({ place: selected, field })}
            onSaveNote={(note) =>
              setNote.mutate({
                place: {
                  id: selected.id,
                  type: selected.type,
                  name: selected.name,
                  city: selected.city,
                },
                note,
              })
            }
            onClose={() => setSelected(null)}
          />
        ) : null}
      </YStack>
    </YStack>
  );
}
