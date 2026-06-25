import { View } from 'react-native';

import { palette } from '@/theme/tokens';

// Decorative "book spines" motif used on the auth screen: colored vertical bars
// of varied heights aligned to a baseline rule.
const SPINES: { color: string; height: number }[] = [
  { color: palette.aizome, height: 56 },
  { color: palette.terracotta, height: 44 },
  { color: palette.ink, height: 64 },
  { color: palette.sage, height: 38 },
  { color: '#B0853A', height: 52 },
  { color: palette.concrete, height: 60 },
  { color: '#46384A', height: 42 },
  { color: palette.aizomeDeep, height: 50 },
  { color: '#A8603D', height: 58 },
];

export function BookSpines() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: palette.hairlineStrong,
        paddingBottom: 0,
      }}
    >
      {SPINES.map((s, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: s.height,
            backgroundColor: s.color,
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
          }}
        />
      ))}
    </View>
  );
}
