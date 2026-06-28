import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Button, Text, TextArea, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import { useUserPlaceActions, useUserPlaces } from '@/features/places/use-places';
import { env } from '@/lib/env';
import { palette } from '@/theme/tokens';

const TYPE_META: Record<string, { label: string; color: string; glyph: string }> = {
  librairie: { label: 'Librairie', color: palette.brick, glyph: '📚' },
  festival: { label: 'Festival', color: palette.gold, glyph: '🎪' },
  cafe_philo: { label: 'Café philo', color: palette.prussian, glyph: '☕' },
  cercle_lecture: { label: 'Cercle', color: palette.forest, glyph: '👥' },
  atelier_ecriture: { label: 'Atelier', color: '#6B5B95', glyph: '✍️' },
};

interface NativePlace {
  id: string;
  ptype: string;
  name: string;
  city?: string;
  postal_code?: string;
  website?: string;
  period?: string;
  specialty?: string;
  events_url?: string;
  lat: number;
  lng: number;
}

const GEOJSON_URL = `${env.webUrl ?? 'https://colophon-three.vercel.app'}/lieux.geojson`;

/** Self-contained Leaflet map (same lib as the web) rendered inside the WebView.
 *  Marker taps are posted out to React Native for the native detail sheet. */
function mapHtml(geojsonUrl: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css">
<style>
 html,body,#map{height:100%;margin:0;padding:0}
 body{font-family:-apple-system,system-ui,sans-serif;background:#EFE6D3}
 #bar{position:absolute;z-index:1000;top:8px;left:8px;right:8px;display:flex;flex-wrap:wrap;gap:6px}
 .chip{padding:6px 11px;border-radius:999px;border:1px solid #DED4BF;background:#FBF6EC;font-size:12px;font-weight:600;color:#6E6A62;white-space:nowrap}
</style></head><body>
<div id="bar"></div><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
var TYPES=[['librairie','📚','#AE4133','Librairies'],['festival','🎪','#B5832E','Festivals'],['cafe_philo','☕','#225F77','Cafés philo'],['cercle_lecture','👥','#2D6B4E','Cercles'],['atelier_ecriture','✍️','#6B5B95','Ateliers']];
var COLOR={},GLYPH={},active={};TYPES.forEach(function(t){COLOR[t[0]]=t[2];GLYPH[t[0]]=t[1];active[t[0]]=true;});
var mineFav=false,mineVis=false,favSet={},visSet={},feats=[],layer=null;
function post(o){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(o));}
var map=L.map('map',{scrollWheelZoom:true,zoomControl:true}).setView([46.6,2.4],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
window.__setMine=function(f,v){favSet={};f.forEach(function(i){favSet[i]=1;});visSet={};v.forEach(function(i){visSet[i]=1;});render();};
function render(){
 if(layer)map.removeLayer(layer);
 layer=L.markerClusterGroup({chunkedLoading:true,maxClusterRadius:50});
 var mineOnly=mineFav||mineVis;
 for(var i=0;i<feats.length;i++){var f=feats[i],p=f.properties;
  if(!active[p.type])continue;
  if(mineOnly){if(!((mineFav&&favSet[p.id])||(mineVis&&visSet[p.id])))continue;}
  var c=f.geometry.coordinates,lat=c[1],lng=c[0];
  var col=COLOR[p.type]||'#2A1E15',g=GLYPH[p.type]||'•';
  var icon=L.divIcon({className:'',html:'<div style="width:22px;height:22px;border-radius:50%;background:#FBF6EC;border:2px solid '+col+';box-shadow:0 1px 3px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:12px">'+g+'</div>',iconSize:[22,22],iconAnchor:[11,11]});
  (function(p,lat,lng){var m=L.marker([lat,lng],{icon:icon});m.on('click',function(){post({t:'select',place:{id:p.id,ptype:p.type,name:p.name||'Lieu',city:p.city||'',postal_code:p.postal_code||'',website:p.website||'',period:p.period||'',specialty:p.specialty||'',events_url:p.events_url||'',lat:lat,lng:lng}});});layer.addLayer(m);})(p,lat,lng);
 }
 map.addLayer(layer);
}
var bar=document.getElementById('bar');
TYPES.forEach(function(t){var b=document.createElement('div');b.className='chip';b.textContent=t[1]+' '+t[3];b.style.background=t[2];b.style.borderColor=t[2];b.style.color='#fff';
 b.onclick=function(){active[t[0]]=!active[t[0]];if(active[t[0]]){b.style.background=t[2];b.style.borderColor=t[2];b.style.color='#fff';}else{b.style.background='#FBF6EC';b.style.borderColor='#DED4BF';b.style.color='#6E6A62';}render();};bar.appendChild(b);});
function mineChip(label,col,get,set){var b=document.createElement('div');b.className='chip';b.textContent=label;
 b.onclick=function(){var nv=!get();set(nv);if(nv){b.style.background=col;b.style.borderColor=col;b.style.color='#fff';}else{b.style.background='#FBF6EC';b.style.borderColor='#DED4BF';b.style.color='#6E6A62';}render();};bar.appendChild(b);}
mineChip('♥ Coups de cœur','#AE4133',function(){return mineFav;},function(v){mineFav=v;});
mineChip('✓ Visités','#2D6B4E',function(){return mineVis;},function(v){mineVis=v;});
fetch('${geojsonUrl}').then(function(r){return r.json();}).then(function(d){feats=d.features||[];render();post({t:'ready'});}).catch(function(){post({t:'error'});});
</script></body></html>`;
}

function DetailSheet({
  place,
  mark,
  signedIn,
  onToggle,
  onSaveNote,
  onClose,
}: {
  place: NativePlace;
  mark: { favorite: boolean; visited: boolean; note: string | null } | undefined;
  signedIn: boolean;
  onToggle: (field: 'favorite' | 'visited') => void;
  onSaveNote: (note: string) => void;
  onClose: () => void;
}) {
  const meta = TYPE_META[place.ptype] ?? { label: place.ptype, color: palette.ink, glyph: '•' };
  const fav = mark?.favorite ?? false;
  const visited = mark?.visited ?? false;
  const note = mark?.note ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const specialties = (place.specialty || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const dir = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const search = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [place.name, place.postal_code, place.city].filter(Boolean).join(' '),
  )}`;

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
      {...shadow}
    >
      <XStack alignItems="flex-start" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$1.5">
            <Text fontSize={13}>{meta.glyph}</Text>
            <Text
              fontFamily="$body"
              fontSize={11}
              fontWeight="700"
              letterSpacing={1.4}
              textTransform="uppercase"
              color={meta.color}
            >
              {meta.label}
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
          {specialties.length > 0 ? (
            <Text fontFamily="$body" fontSize={12} color="$colorSoft">
              {specialties.join(' · ')}
            </Text>
          ) : null}
        </YStack>
        <Text
          onPress={onClose}
          fontFamily="$body"
          fontSize={15}
          fontWeight="600"
          color="$accent"
          paddingHorizontal="$2"
          paddingVertical="$1"
        >
          Fermer
        </Text>
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        <Button
          onPress={() => Linking.openURL(dir)}
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
            onPress={() => Linking.openURL(place.website!)}
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
          onPress={() => Linking.openURL(search)}
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
        {place.events_url ? (
          <Button
            onPress={() => Linking.openURL(place.events_url!)}
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

          {editing ? (
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
                    setEditing(false);
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
                    setEditing(false);
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
                onPress={() => setEditing(true)}
                fontFamily="$body"
                fontSize={13}
                fontWeight="600"
                color="$accent"
              >
                Modifier l’anecdote
              </Text>
            </YStack>
          ) : (
            <Text
              onPress={() => setEditing(true)}
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
              color="$accent"
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

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 16,
} as const;

export function PlacesMap() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: marks } = useUserPlaces(userId);
  const { toggle, setNote } = useUserPlaceActions(userId);
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<NativePlace | null>(null);
  const html = useMemo(() => mapHtml(GEOJSON_URL), []);

  const favIds = useMemo(
    () => [...(marks?.entries() ?? [])].filter(([, m]) => m.favorite).map(([id]) => id),
    [marks],
  );
  const visIds = useMemo(
    () => [...(marks?.entries() ?? [])].filter(([, m]) => m.visited).map(([id]) => id),
    [marks],
  );

  // Push my coups de cœur / visités into the map for its "mine" filter.
  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(
      `window.__setMine && window.__setMine(${JSON.stringify(favIds)},${JSON.stringify(visIds)}); true;`,
    );
  }, [ready, favIds, visIds]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { t: string; place?: NativePlace };
      if (msg.t === 'ready') setReady(true);
      else if (msg.t === 'select' && msg.place) setSelected(msg.place);
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: env.webUrl ?? 'https://colophon-three.vercel.app' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
      {selected ? (
        <DetailSheet
          place={selected}
          mark={marks?.get(selected.id)}
          signedIn={!!userId}
          onToggle={(field) =>
            toggle.mutate({
              place: {
                id: selected.id,
                type: selected.ptype,
                name: selected.name,
                city: selected.city,
              },
              field,
            })
          }
          onSaveNote={(note) =>
            setNote.mutate({
              place: {
                id: selected.id,
                type: selected.ptype,
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
  );
}
