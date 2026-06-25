import type { ReactElement } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'library'
  | 'trends'
  | 'scan'
  | 'discussions'
  | 'profile'
  | 'search'
  | 'plus'
  | 'close';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Linear icon set (1.5 stroke, currentColor) per the Colophon handoff.
const PATHS: Record<IconName, () => ReactElement> = {
  library: () => (
    <>
      <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <Path d="M9 4h4.5A1.5 1.5 0 0 1 15 5.5v13A1.5 1.5 0 0 1 13.5 20H9z" />
      <Path d="m15.5 5 3.4.9a1.5 1.5 0 0 1 1.05 1.84L16.8 19.3" />
    </>
  ),
  trends: () => (
    <>
      <Path d="M4 16l4.5-5 3.5 3 7-8" />
      <Path d="M16 6h3v3" />
    </>
  ),
  scan: () => (
    <>
      <Path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8" />
      <Path d="M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8" />
      <Path d="M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16" />
      <Path d="M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" />
      <Path d="M7.5 12h9" />
    </>
  ),
  discussions: () => (
    <Path d="M4 12a7 7 0 0 1 7-7h2a7 7 0 0 1 0 14H8l-3.2 2.4a.5.5 0 0 1-.8-.4V16.5A7 7 0 0 1 4 12z" />
  ),
  profile: () => (
    <>
      <Circle cx="12" cy="8" r="3.5" />
      <Path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  search: () => (
    <>
      <Circle cx="11" cy="11" r="6" />
      <Path d="m16 16 4 4" />
    </>
  ),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  close: () => <Path d="M6 6l12 12M18 6 6 18" />,
};

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]()}
    </Svg>
  );
}
