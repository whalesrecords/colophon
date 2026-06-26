import Svg, { G, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme/tokens';

/**
 * Auth-screen hero: a cat asleep on a small stack of books. Wabi-sabi line art,
 * rendered as SVG (crisp at any size; swappable for an artist illustration later).
 */
export function CatOnBooks({ width = 208 }: { width?: number }) {
  const height = (width * 168) / 216;
  const ink = palette.ink;
  return (
    <Svg width={width} height={height} viewBox="0 0 216 168">
      {/* book stack */}
      <Rect x={33} y={126} width={150} height={21} rx={7} fill="#454F5C" />
      <Rect x={41} y={126} width={4} height={21} rx={2} fill="rgba(244,241,234,0.18)" />
      <Rect x={20} y={105} width={170} height={21} rx={7} fill="#9A7C50" />
      <Rect x={28} y={105} width={4} height={21} rx={2} fill="rgba(244,241,234,0.18)" />
      <Rect x={40} y={84} width={138} height={21} rx={7} fill="#7C846F" />
      <Rect x={48} y={84} width={4} height={21} rx={2} fill="rgba(244,241,234,0.18)" />

      <G stroke={ink} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round">
        {/* tail, draping down off the right edge with a dark tip */}
        <Path
          d="M150 70 C 190 70 204 100 188 128 C 183 138 173 142 168 134"
          fill="none"
        />
        <Path
          d="M188 128 C 183 138 173 142 168 134 C 173 130 177 122 178 114 C 184 116 188 122 188 128 Z"
          fill={ink}
          stroke="none"
        />

        {/* body + back, resting on the top book */}
        <Path
          d="M52 84
             C 44 84 40 76 44 68
             C 36 60 40 46 50 46
             C 54 36 66 38 68 48
             C 78 40 92 42 92 52
             C 110 40 150 42 166 60
             C 176 72 176 84 160 84
             Z"
          fill="#FDFBF5"
        />

        {/* tucked front paw */}
        <Path d="M52 84 C 62 80 78 80 90 84" fill="none" strokeWidth={2} />

        {/* ear insides (dark) */}
        <Path d="M50 47 L52 37 L60 48 Z" fill={ink} stroke="none" />

        {/* a calico patch on the back */}
        <Path
          d="M120 50 C 132 44 148 46 156 56 C 146 60 130 60 120 56 Z"
          fill={ink}
          stroke="none"
        />

        {/* closed sleeping eyes */}
        <Path d="M58 64 C 61 67 65 67 68 64" fill="none" strokeWidth={2} />
        <Path d="M74 64 C 77 67 81 67 84 64" fill="none" strokeWidth={2} />

        {/* nose */}
        <Path d="M50 70 l4 3 l-4 3 Z" fill={ink} stroke="none" />

        {/* whiskers */}
        <Path d="M50 72 L34 70 M50 75 L34 77" fill="none" strokeWidth={1.4} />
      </G>
    </Svg>
  );
}
