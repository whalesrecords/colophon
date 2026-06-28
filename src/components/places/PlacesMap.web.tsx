/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { palette } from '@/theme/tokens';

// Leaflet is loaded from a CDN at runtime (web only) so we don't bundle a DOM map
// lib into the native graph. 5 711 points are clustered for performance.
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
] as const;
const COLOR: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.color]));

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

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

function popupHtml(p: any): string {
  const name = escapeHtml(p.name || 'Lieu');
  const city = p.city ? escapeHtml([p.postal_code, p.city].filter(Boolean).join(' ')) : '';
  const site = p.website
    ? `<a href="${escapeHtml(p.website)}" target="_blank" rel="noopener" style="color:${palette.brick};font-weight:600">Site web ↗</a>`
    : '';
  let agenda = '';
  if (p.type === 'festival') {
    const text = encodeURIComponent(p.name || 'Festival du livre');
    const loc = encodeURIComponent([p.city].filter(Boolean).join(', '));
    const details = encodeURIComponent(
      `Festival du livre — ${p.period || ''}. Dates: ${p.website || 'voir le site'}`,
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&location=${loc}&details=${details}`;
    agenda = `<div style="margin-top:6px"><a href="${url}" target="_blank" rel="noopener" style="color:${palette.prussian};font-weight:600">+ Ajouter à l'agenda</a></div>`;
  }
  const period = p.period
    ? `<div style="color:#8C8479;font-size:12px;margin-top:2px">${escapeHtml(p.period)}</div>`
    : '';
  return `<div style="font-family:sans-serif;min-width:160px">
    <div style="font-weight:700;font-size:14px;color:#2A1E15">${name}</div>
    ${city ? `<div style="color:#8C8479;font-size:12px">${city}</div>` : ''}
    ${period}
    <div style="margin-top:6px">${site}</div>
    ${agenda}
  </div>`;
}

export function PlacesMap() {
  const hostRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const featuresRef = useRef<any[]>([]);
  const layerRef = useRef<any>(null);
  const [active, setActive] = useState<Record<string, boolean>>({
    librairie: true,
    festival: true,
    cafe_philo: true,
    cercle_lecture: true,
  });
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    let n = 0;
    for (const f of featuresRef.current) {
      const p = f.properties;
      if (!active[p.type]) continue;
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
      m.bindPopup(popupHtml(p));
      cluster.addLayer(m);
      n += 1;
    }
    map.addLayer(cluster);
    layerRef.current = cluster;
    setCount(n);
  }, [active]);

  // Init map once.
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

  // Re-render markers when filters change.
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
              cursor="pointer"
              {...({ hoverStyle: { opacity: 0.9 } } as any)}
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

      {error ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text fontFamily="$body" color="$colorMuted">
            {error}
          </Text>
        </YStack>
      ) : null}

      {/* Real DOM node Leaflet mounts into (web build uses react-dom). */}
      <div ref={hostRef as any} style={{ flexGrow: 1, width: '100%', minHeight: 300 }} />
    </YStack>
  );
}
