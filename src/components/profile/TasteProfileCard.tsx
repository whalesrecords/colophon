import Svg, { Circle, G } from 'react-native-svg';
import { Text, XStack, YStack } from 'tamagui';

import { Card, SectionLabel } from '@/components/ui';
import { type TasteCluster, useReaderTaste } from '@/features/library/use-reader-taste';
import { palette } from '@/theme/tokens';

const COLORS = [
  palette.terracotta,
  palette.prussian,
  palette.forest,
  palette.gold,
  palette.aizome,
  palette.concrete,
  '#8C6A4A',
];
const TRACK = '#E7DDCB';

function Donut({ clusters }: { clusters: TasteCluster[] }) {
  const size = 132;
  const sw = 20;
  const r = (size - sw) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = clusters.reduce((s, x) => s + Math.max(0, x.percent), 0) || 1;
  let acc = 0;
  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${c} ${c})`}>
        <Circle cx={c} cy={c} r={r} stroke={TRACK} strokeWidth={sw} fill="none" />
        {clusters.map((cl, i) => {
          const len = (Math.max(0, cl.percent) / total) * circ;
          const el = (
            <Circle
              key={cl.label}
              cx={c}
              cy={c}
              r={r}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={sw}
              fill="none"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </G>
    </Svg>
  );
}

/** "Profil de lecture" — a camembert of the reader's semantic universes (from the
 *  reader-taste edge function). Hidden until the profile has been computed. */
export function TasteProfileCard({ userId }: { userId: string | undefined }) {
  const { data } = useReaderTaste(userId);
  const clusters = (data?.clusters ?? [])
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent);
  if (clusters.length === 0) return null;

  return (
    <Card gap="$3">
      <SectionLabel>Profil de lecture</SectionLabel>
      <XStack gap="$4" alignItems="center">
        <Donut clusters={clusters} />
        <YStack flex={1} gap="$2">
          {clusters.map((cl, i) => (
            <XStack key={cl.label} alignItems="center" gap="$2">
              <YStack
                width={10}
                height={10}
                borderRadius={3}
                backgroundColor={COLORS[i % COLORS.length]}
              />
              <Text flex={1} fontFamily="$body" fontSize={13} color="$colorSoft" numberOfLines={1}>
                {cl.label}
              </Text>
              <Text
                fontFamily="$body"
                fontSize={13}
                fontWeight="700"
                color="$color"
                fontVariant={['tabular-nums']}
              >
                {Math.round(cl.percent)}%
              </Text>
            </XStack>
          ))}
        </YStack>
      </XStack>
    </Card>
  );
}
