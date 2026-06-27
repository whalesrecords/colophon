import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';

import { palette } from '@/theme/tokens';

const DURATION = 1500;

function lerp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      const f = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + f * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}

/**
 * Loading / "searching" indicator: a small open book whose page turns on a brisk
 * loop. Same SVG + setInterval technique as the login hero (BookPageTurn), sized
 * down for inline use in place of a generic spinner.
 */
export function BookLoader({ size = 46 }: { size?: number }) {
  const W = size;
  const H = W * 0.78;
  const [p, setP] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setP(((Date.now() - start) % DURATION) / DURATION);
    }, 1000 / 30);
    return () => clearInterval(id);
  }, []);

  const sx = W / 100;
  const sy = H / 78;
  const spineX = 50 * sx;
  const pageTop = 12 * sy;
  const pageW = 40 * sx; // 50 -> 90
  const pageH = 52 * sy;

  const deg = lerp(p, [0, 0.6, 1], [0, -180, -180]);
  const opacity = lerp(p, [0, 0.85, 0.95, 1], [1, 1, 0, 0]);

  const paper = '#FBF8F1';
  const line = 'rgba(28,26,23,0.18)';

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox="0 0 100 78">
        <Rect x={4} y={6} width={92} height={66} rx={7} fill={palette.aizome} />
        <Rect x={47} y={6} width={6} height={66} fill="#1F2C42" />
        <Rect x={8} y={11} width={40} height={56} rx={3} fill={paper} />
        <Rect x={52} y={11} width={40} height={56} rx={3} fill={paper} />
        <G stroke={line} strokeWidth={2.4} strokeLinecap="round">
          {[22, 33, 44, 55].map((y) => (
            <Line key={`l${y}`} x1={14} y1={y} x2={42} y2={y} />
          ))}
          {[22, 33, 44, 55].map((y) => (
            <Line key={`r${y}`} x1={58} y1={y} x2={86} y2={y} />
          ))}
        </G>
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: spineX,
          top: pageTop,
          width: pageW,
          height: pageH,
          transformOrigin: '0% 50%',
          backgroundColor: paper,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
          paddingVertical: pageH * 0.14,
          paddingHorizontal: pageW * 0.16,
          justifyContent: 'space-between',
          opacity,
          transform: [{ perspective: 360 }, { rotateY: `${deg}deg` }],
        }}
      >
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ height: 2, borderRadius: 1, backgroundColor: line }} />
        ))}
      </View>
    </View>
  );
}
