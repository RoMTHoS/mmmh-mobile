import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, spacing, radius } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: keyof typeof spacing | number;
  shadow?: boolean;
}

export function Card({ children, style, onPress, padding = 'md', shadow = true }: Props) {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const cardStyle = [styles.card, shadow && styles.shadow, { padding: paddingValue }, style];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});
