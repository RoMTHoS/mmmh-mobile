/**
 * Custom Icon component using react-native-svg
 * Icons from Majesticons - https://github.com/halfmage/majesticons
 */
import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '../../theme';

export const iconNames = [
  'arrow-left',
  'bookmark',
  'calories',
  'camera',
  'cart',
  'check',
  'close',
  'clipboard',
  'cost',
  'error',
  'globe',
  'home',
  'instagram',
  'menu',
  'pencil',
  'plus',
  'plus-circle',
  'refresh',
  'search',
  'servings',
  'share',
  'text',
  'tiktok',
  'time',
  'youtube',
] as const;

export type IconName = (typeof iconNames)[number];

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof iconSizes;

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 'md', color = colors.text, strokeWidth = 2 }: IconProps) {
  const sizeValue = typeof size === 'number' ? size : iconSizes[size];
  const iconColor = color;

  const commonStrokeProps = {
    fill: 'none',
    stroke: iconColor,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  };

  const renderIcon = () => {
    switch (name) {
      case 'arrow-left':
        return <Path d="m5 12l6-6m-6 6l6 6m-6-6h14" {...commonStrokeProps} />;

      case 'bookmark':
        return (
          <Path
            d="M17 3H7a2 2 0 0 0-2 2v15.138a.5.5 0 0 0 .748.434l5.26-3.005a2 2 0 0 1 1.984 0l5.26 3.006a.5.5 0 0 0 .748-.435V5a2 2 0 0 0-2-2m-5 4v3m0 3v-3m0 0H9m3 0h3"
            {...commonStrokeProps}
          />
        );

      case 'calories':
        return (
          <G fill={iconColor}>
            <Path d="M12.77 2.362a1 1 0 0 0-1.325-.194c-.65.434-1.495 1.305-2.181 2.573a10.504 10.504 0 0 0-1.145 3.538a7.593 7.593 0 0 1-.083-.064c-.52-.403-.865-.784-.992-1.066A1 1 0 0 0 5.4 6.882a9 9 0 1 0 10.817-1.833c-1.595-.756-2.98-2.122-3.447-2.687zm-1.748 3.33c.3-.553.623-.984.91-1.3c.789.774 2.008 1.786 3.404 2.452a7 7 0 1 1-9.214 2.354c.225.223.463.423.688.598c.613.475 1.27.863 1.743 1.099A1 1 0 0 0 10 10c0-1.845.465-3.277 1.022-4.307zm2.268 4.695a1 1 0 0 0-1.37-.202c-.31.22-.639.603-.892 1.101a4.017 4.017 0 0 0-.122.264a1 1 0 0 0-.994.315A3.756 3.756 0 0 0 9 14.332C9 16.297 10.507 18 12.5 18s3.5-1.703 3.5-3.667c0-1.366-.717-2.583-1.818-3.216a2.54 2.54 0 0 1-.57-.396a2.895 2.895 0 0 1-.322-.334zM11 14.333c0-.055.002-.11.007-.164l.085.047a1 1 0 0 0 1.47-.883c0-.318.047-.584.113-.8c.163.119.34.232.529.329c.457.271.796.814.796 1.471c0 .983-.731 1.667-1.5 1.667s-1.5-.684-1.5-1.667z" />
          </G>
        );

      case 'camera':
        return (
          <G {...commonStrokeProps}>
            <Path d="M3 18V9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2" />
            <Circle cx={12} cy={13} r={3} />
          </G>
        );

      case 'cart':
        return (
          <G {...commonStrokeProps}>
            <Path d="M3 3h2l.5 3m0 0L7 15h11l3-9z" />
            <Circle cx={8} cy={20} r={1} />
            <Circle cx={17} cy={20} r={1} />
          </G>
        );

      case 'check':
        return <Path d="M5 13l4 4L19 7" {...commonStrokeProps} />;

      case 'close':
        return <Path d="M6 6l12 12M6 18L18 6" {...commonStrokeProps} />;

      case 'clipboard':
        return (
          <G {...commonStrokeProps}>
            <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <Path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          </G>
        );

      case 'cost':
        return (
          <G {...commonStrokeProps}>
            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10" />
            <Path d="M16 8a5 5 0 1 0 0 8m-9-5.5h5m0 3H7" />
          </G>
        );

      case 'error':
        return (
          <G {...commonStrokeProps}>
            <Circle cx={12} cy={12} r={9} />
            <Path d="M12 8v4m0 4h.01" />
          </G>
        );

      case 'globe':
        return (
          <G fill={iconColor}>
            <Path d="M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16zM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12z" />
            <Path d="M11.293 2.293c-5.361 5.36-5.361 14.053 0 19.414h1.414c5.361-5.361 5.361-14.053 0-19.414h-1.414zM12 4.479c3.637 4.343 3.637 10.7 0 15.042c-3.637-4.343-3.637-10.7 0-15.042z" />
            <Path d="M3 9a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" />
          </G>
        );

      case 'home':
        return (
          <Path
            d="M20 19v-8.5a1 1 0 0 0-.4-.8l-7-5.25a1 1 0 0 0-1.2 0l-7 5.25a1 1 0 0 0-.4.8V19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1"
            {...commonStrokeProps}
          />
        );

      case 'instagram':
        return (
          <G fill={iconColor}>
            <Path d="M12 2c-2.716 0-3.056.012-4.123.06c-1.064.049-1.791.218-2.427.465a4.9 4.9 0 0 0-1.772 1.153A4.9 4.9 0 0 0 2.525 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.284 2 12s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.9 4.9 0 0 0 1.153 1.772a4.9 4.9 0 0 0 1.772 1.153c.636.247 1.363.416 2.427.465c1.067.048 1.407.06 4.123.06s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.9 4.9 0 0 0 1.772-1.153a4.9 4.9 0 0 0 1.153-1.772c.247-.636.416-1.363.465-2.427c.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.9 4.9 0 0 0-1.153-1.772a4.9 4.9 0 0 0-1.772-1.153c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.716 2 12 2m0 1.802c2.67 0 2.986.01 4.04.058c.976.045 1.505.207 1.858.344c.466.182.8.399 1.15.748c.35.35.566.684.748 1.15c.136.353.3.882.344 1.857c.048 1.055.058 1.37.058 4.041s-.01 2.986-.058 4.04c-.045.976-.208 1.505-.344 1.858a3.1 3.1 0 0 1-.748 1.15c-.35.35-.684.566-1.15.748c-.353.136-.882.3-1.857.344c-1.054.048-1.37.058-4.041.058s-2.987-.01-4.04-.058c-.976-.045-1.505-.208-1.858-.344a3.1 3.1 0 0 1-1.15-.748a3.1 3.1 0 0 1-.748-1.15c-.137-.353-.3-.882-.344-1.857c-.048-1.055-.058-1.37-.058-4.041s.01-2.986.058-4.04c.045-.976.207-1.505.344-1.858c.182-.466.399-.8.748-1.15c.35-.35.684-.566 1.15-.748c.353-.137.882-.3 1.857-.344c1.055-.048 1.37-.058 4.041-.058" />
            <Path d="M12 15.333a3.333 3.333 0 1 1 0-6.666a3.333 3.333 0 0 1 0 6.666m0-8.468a5.135 5.135 0 1 0 0 10.27a5.135 5.135 0 0 0 0-10.27m6.538-.203a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 0 1 2.4 0" />
          </G>
        );

      case 'menu':
        return <Path d="M5 6h14M5 10h14M5 14h14M5 18h14" {...commonStrokeProps} />;

      case 'pencil':
        return (
          <G fill={iconColor}>
            <Path d="M15.586 3a2 2 0 0 1 2.828 0L21 5.586a2 2 0 0 1 0 2.828l-12 12A2 2 0 0 1 7.586 21H5a2 2 0 0 1-2-2v-2.586A2 2 0 0 1 3.586 15l12-12zm-.172 3L18 8.586L19.586 7L17 4.414L15.414 6zm1.172 4L14 7.414l-9 9V19h2.586l9-9z" />
          </G>
        );

      case 'plus':
        return <Path d="M5 12h7m7 0h-7m0 0V5m0 7v7" {...commonStrokeProps} />;

      case 'plus-circle':
        return (
          <Path
            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm11-3a1 1 0 1 0-2 0v2H9a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2V9z"
            fill={iconColor}
            fillRule="evenodd"
            clipRule="evenodd"
          />
        );

      case 'refresh':
        return (
          <G {...commonStrokeProps}>
            <Path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" />
            <Path d="M4 4v4h4m12 12v-4h-4" />
          </G>
        );

      case 'search':
        return (
          <Path
            d="m20 20l-4.05-4.05m0 0a7 7 0 1 0-9.9-9.9a7 7 0 0 0 9.9 9.9"
            {...commonStrokeProps}
          />
        );

      case 'servings':
        return (
          <G {...commonStrokeProps}>
            <Circle cx={12} cy={8} r={5} />
            <Path d="M20 21a8 8 0 1 0-16 0m16 0a8 8 0 1 0-16 0" />
          </G>
        );

      case 'share':
        return (
          <Path
            d="m20 12l-6.4-7v3.5C10.4 8.5 4 10.6 4 19c0-1.167 1.92-3.5 9.6-3.5V19z"
            {...commonStrokeProps}
          />
        );

      case 'text':
        return (
          <Path
            d="M8 8h8m0 4H8m0 4h4m-6 4h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"
            {...commonStrokeProps}
          />
        );

      case 'time':
        return (
          <G {...commonStrokeProps}>
            <Circle cx={12} cy={12} r={9} />
            <Path d="M12 7v3.764a2 2 0 0 0 1.106 1.789L16 14" />
          </G>
        );

      case 'tiktok':
        return (
          <Path
            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1"
            fill={iconColor}
          />
        );

      case 'youtube':
        return (
          <Path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z"
            fill={iconColor}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Svg width={sizeValue} height={sizeValue} viewBox="0 0 24 24" accessibilityRole="image">
      {renderIcon()}
    </Svg>
  );
}
