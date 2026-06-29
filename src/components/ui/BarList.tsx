import { useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { useThemePref } from '@/theme/theme-pref';
import { palette } from '@/theme/tokens';

const LIGHT = [palette.brick, palette.prussian, palette.forest, palette.gold];
const DARK = [palette.brickDark, palette.prussianDark, palette.forestDark, palette.goldDark];

/** The four tranches, cycled by row index, dark-aware. */
export function useTranches() {
  const { effective } = useThemePref();
  return effective === 'dark' ? DARK : LIGHT;
}

/**
 * BarRow — a labelled value bar. Label 14px ink (flex), value Spectral 600 16px in
 * the row's tranche colour, rail 8px (radius 999, `$track`) filled by `count/max`.
 * Height 8px everywhere (the refonte fixes the old 4/6/8/10 inconsistency).
 */
export function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <YStack gap={8}>
      <XStack alignItems="baseline" gap="$2">
        <Text fontFamily="$body" fontSize={14} color="$color" flex={1} numberOfLines={1}>
          {label}
        </Text>
        <Text fontFamily="$heading" fontSize={16} fontWeight="600" color={color}>
          {value}
        </Text>
      </XStack>
      <YStack height={8} borderRadius={999} backgroundColor="$track" overflow="hidden">
        <YStack height={8} width={`${pct}%`} borderRadius={999} backgroundColor={color} />
      </YStack>
    </YStack>
  );
}

export interface BarEntry {
  label: string;
  count: number;
}

/**
 * BarList — the unified ranked-bar list (Tendances genres/auteurs/tags, Profil
 * classement). Bars coloured by tranche per index. Optional `collapse` shows the
 * first N with a "… voir N de plus" expander.
 */
export function BarList({ entries, collapse }: { entries: BarEntry[]; collapse?: number }) {
  const tranches = useTranches();
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(1, ...entries.map((e) => e.count));
  const limit = collapse ?? entries.length;
  const shown = expanded ? entries : entries.slice(0, limit);
  const hidden = entries.length - limit;
  return (
    <YStack gap={14}>
      {shown.map((e, i) => (
        <BarRow
          key={e.label}
          label={e.label}
          value={e.count}
          max={max}
          color={tranches[i % tranches.length]}
        />
      ))}
      {hidden > 0 ? (
        <Text
          onPress={() => setExpanded((v) => !v)}
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          color="$accent"
          paddingVertical="$1"
          pressStyle={{ opacity: 0.6 }}
        >
          {expanded ? 'Réduire' : `… voir ${hidden} de plus`}
        </Text>
      ) : null}
    </YStack>
  );
}
