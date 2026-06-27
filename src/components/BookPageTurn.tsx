import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';

import { palette } from '@/theme/tokens';

const DURATION = 2800;

/** Piecewise-linear interpolation over (input→output) breakpoints. */
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
 * Auth-screen hero: a flat-design open book whose right page turns over on a
 * gentle loop. SVG + a plain requestAnimationFrame loop (a couple of KB, crisp at
 * any size, animates reliably on web + native with no animation runtime) — rather
 * than shipping a heavy video.
 */
export function BookPageTurn({ width = 208 }: { width?: number }) {
  const W = width;
  const H = W * 0.75;
  const [p, setP] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setP(((Date.now() - start) % DURATION) / DURATION);
    }, 1000 / 30);
    return () => clearInterval(id);
  }, []);

  // Right-page geometry, in screen px, mapped from the 0..200 / 0..150 viewBox.
  const sx = W / 200;
  const sy = H / 150;
  const spineX = 100 * sx;
  const pageTop = 24 * sy;
  const pageW = 80 * sx;
  const pageH = 104 * sy;

  const deg = lerp(p, [0, 0.55, 1], [0, -180, -180]);
  const opacity = lerp(p, [0, 0.86, 0.96, 1], [1, 1, 0, 0]);
  const translateY = lerp(p, [0, 0.275, 0.55, 1], [0, -7, 0, 0]);

  const ink = palette.ink;
  const paper = '#FBF8F1';
  const line = 'rgba(28,26,23,0.16)';

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox="0 0 200 150">
        {/* Cover, peeking around the pages */}
        <Rect x={10} y={16} width={180} height={122} rx={12} fill={palette.aizome} />
        <Rect x={96} y={16} width={8} height={122} fill="#1F2C42" />
        {/* Left + right page blocks */}
        <Rect x={18} y={22} width={80} height={108} rx={6} fill={paper} />
        <Rect x={102} y={22} width={80} height={108} rx={6} fill={paper} />
        {/* Faint text lines */}
        <G stroke={line} strokeWidth={3} strokeLinecap="round">
          {[40, 54, 68, 82, 96, 110].map((y) => (
            <Line key={`l${y}`} x1={28} y1={y} x2={88} y2={y} />
          ))}
          {[40, 54, 68, 82, 96, 110].map((y) => (
            <Line key={`r${y}`} x1={112} y1={y} x2={172} y2={y} />
          ))}
        </G>
        {/* Spine shadow */}
        <Rect x={92} y={22} width={16} height={108} fill="rgba(28,26,23,0.05)" />
      </Svg>

      {/* The turning page, anchored at the spine. */}
      <View
        style={{
          position: 'absolute',
          left: spineX,
          top: pageTop,
          width: pageW,
          height: pageH,
          transformOrigin: '0% 50%',
          backgroundColor: paper,
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(28,26,23,0.08)',
          paddingVertical: pageH * 0.12,
          paddingHorizontal: pageW * 0.14,
          justifyContent: 'space-between',
          shadowColor: ink,
          shadowOpacity: 0.16,
          shadowRadius: 10,
          shadowOffset: { width: -6, height: 4 },
          opacity,
          transform: [{ perspective: 700 }, { translateY }, { rotateY: `${deg}deg` }],
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ height: 3, borderRadius: 2, backgroundColor: line }} />
        ))}
      </View>
    </View>
  );
}
