import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';

/**
 * The Colophon brand mark — a pyramid of four book "tranches" (ocre / forêt /
 * prusse / brique, top→bottom) on an espresso shelf, with a § medallion (the
 * typographer's mark) at the lower right. Light = parchemin field; dark flips the
 * shelf + medallion to parchemin and lightens the slices.
 */
export function ColophonMark({ size = 120, dark = false }: { size?: number; dark?: boolean }) {
  const slices = dark
    ? ['#D8B36A', '#3E9460', '#2E78A6', '#C0533C']
    : ['#B5832E', '#2D6B4E', '#225F77', '#AE4133'];
  const espresso = dark ? '#F4EEE2' : '#2A1E15';
  const glyph = dark ? '#221B14' : '#F4EEE2';
  const edge = 'rgba(0,0,0,0.14)';

  // top→bottom widths (centred on x=50), each 11 high with a 3.5 gap.
  const rows = [
    { w: 44, y: 16 },
    { w: 60, y: 30.5 },
    { w: 72, y: 45 },
    { w: 82, y: 59.5 },
  ];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {rows.map((r, i) => (
        <Rect
          key={i}
          x={50 - r.w / 2}
          y={r.y}
          width={r.w}
          height={11}
          rx={3}
          fill={slices[i]}
        />
      ))}
      {rows.map((r, i) => (
        <Rect
          key={`e${i}`}
          x={50 - r.w / 2}
          y={r.y + 8}
          width={r.w}
          height={3}
          rx={1.5}
          fill={edge}
        />
      ))}
      {/* shelf */}
      <Rect x={6} y={74} width={88} height={3} rx={1.5} fill={espresso} />
      {/* § medallion */}
      <Circle cx={82} cy={80} r={15} fill={espresso} />
      <SvgText
        x={82}
        y={86}
        fontFamily="Spectral_600SemiBold"
        fontSize={19}
        fill={glyph}
        textAnchor="middle"
      >
        §
      </SvgText>
    </Svg>
  );
}
