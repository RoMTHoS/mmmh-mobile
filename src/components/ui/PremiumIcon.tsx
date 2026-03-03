import Svg, { Path } from 'react-native-svg';

interface PremiumIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export function PremiumIcon({ width = 100, height, color }: PremiumIconProps) {
  const computedHeight = height ?? width * (337 / 507);
  return (
    <Svg
      width={width}
      height={computedHeight}
      viewBox="0 0 507 337"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="Premium crown"
    >
      <Path
        d="M499.471 291C496.099 313.083 477.025 330 454 330H53C29.9748 330 10.9008 313.083 7.5293 291H499.471Z"
        fill={color ? color : '#FFFEFA'}
        stroke={color ? color : 'black'}
        strokeWidth={14}
      />
      <Path
        d="M351.198 187.048L357.375 199.817L363.753 187.147L430.813 53.9238L497.16 245H9.18945L62.5303 51.3564L168.464 188.283L175.198 196.988L180.227 187.198L268.312 15.6875L351.198 187.048Z"
        fill={color ? color : '#FFFEFA'}
        stroke={color ? color : 'black'}
        strokeWidth={14}
      />
    </Svg>
  );
}
