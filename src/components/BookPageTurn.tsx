import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Rect } from 'react-native-svg';

import { palette } from '@/theme/tokens';

/**
 * Auth-screen hero: a flat-design open book whose right page turns over on a
 * gentle loop. Built from SVG + reanimated (a couple of KB, crisp at any size,
 * works on web + native) rather than a heavy video. Replaces the static art.
 */
export function BookPageTurn({ width = 208 }: { width?: number }) {
  const W = width;
  const H = W * 0.75;
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false,
    );
  }, [t]);

  // Right-page geometry, in screen px, mapped from the 0..200 / 0..150 viewBox.
  const sx = W / 200;
  const sy = H / 150;
  const spineX = 100 * sx;
  const pageTop = 24 * sy;
  const pageW = 80 * sx; // 100 -> 180
  const pageH = 104 * sy;

  const pageStyle = useAnimatedStyle(() => {
    const deg = interpolate(t.value, [0, 0.55, 1], [0, -180, -180], Extrapolation.CLAMP);
    const opacity = interpolate(t.value, [0, 0.86, 0.96, 1], [1, 1, 0, 0], Extrapolation.CLAMP);
    const lift = interpolate(t.value, [0, 0.275, 0.55, 1], [0, -7, 0, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ perspective: 700 }, { translateY: lift }, { rotateY: `${deg}deg` }],
    };
  });

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
      <Animated.View
        style={[
          {
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
          },
          pageStyle,
        ]}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ height: 3, borderRadius: 2, backgroundColor: line }} />
        ))}
      </Animated.View>
    </View>
  );
}
